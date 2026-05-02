const JournalEntry = require("../models/JournalEntry.model");
const Session = require("../models/Session.model");
const User = require("../models/User.model");
const VKSequence = require("../models/VinyasaKramaSequence.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");
const { deleteImgCloudinary } = require("../../utils/deleteImage");

/**
 * Controller: getJournalEntries
 * ----------------------------------
 * Retrieves all journal entries for the authenticated user.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * - startDate: Filter from this date
 * - endDate: Filter until this date
 * - sequenceFamily: Filter by VK family
 * - sortBy: "date" | "mood" | "energy" (default: "date")
 *
 * Workflow:
 * 1. Builds filter based on query params.
 * 2. Paginates results.
 * 3. Populates session and pose references.
 * 4. Returns journals with pagination metadata.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - Invalid date formats
 *
 * Notes:
 * - This powers the Digital Garden timeline view.
 * - Sorted by creation date descending by default.
 * - Used for historical analysis and pattern recognition.
 */
const getJournalEntries = async (req, res, next) => {
	try {
		// req.user verified by authenticateToken middleware
		const { page = 1, limit = 20, startDate, endDate, sequenceFamily, sortBy = "date" } = req.query;

		// Build filter
		const filter = { user: req.user._id };

		// Date range filter
		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) filter.createdAt.$gte = new Date(startDate);
			if (endDate) filter.createdAt.$lte = new Date(endDate);
		}

		// VK family filter
		if (sequenceFamily) {
			filter["vkReflection.sequenceFamily"] = sequenceFamily;
		}

		// Determine sort order
		let sortQuery = {};
		switch (sortBy) {
			case "date":
				sortQuery = { createdAt: -1 };
				break;
			case "mood":
				// Can't sort directly on arrays, use aggregation if needed
				sortQuery = { createdAt: -1 };
				break;
			case "energy":
				sortQuery = { "energyLevel.after": -1, createdAt: -1 };
				break;
			default:
				sortQuery = { createdAt: -1 };
		}

		// Pagination
		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		const journals = await JournalEntry.find(filter)
			.populate("session")
			.populate("favoritePoses.pose")
			.populate("challengingPoses.pose")
			.sort(sortQuery)
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await JournalEntry.countDocuments(filter);

		return sendResponse(res, 200, true, "Journal entries retrieved successfully", {
			journals,
			pagination: {
				page: parseInt(page, 10),
				limit: parseInt(limit, 10),
				total,
				pages: Math.ceil(total / parseInt(limit, 10)),
			},
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getJournalEntryById
 * --------------------------------
 * Retrieves a single journal entry by ID.
 *
 * Workflow:
 * 1. Finds journal by ID.
 * 2. Verifies ownership.
 * 3. Populates all references.
 * 4. Returns complete journal data.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Journal belongs to different user
 * - 404: Journal not found
 *
 * Notes:
 * - Full population for detailed view.
 * - Shows complete reflection and session context.
 */
const getJournalEntryById = async (req, res, next) => {
	try {
		// req.user verified by authenticateToken middleware
		const { id } = req.params;

		const journal = await JournalEntry.findById(id)
			.populate({
				path: "session",
				populate: { path: "vkSequence" },
			})
			.populate("favoritePoses.pose")
			.populate("challengingPoses.pose");

		if (!journal) {
			throw createError(404, "Journal entry not found");
		}

		// Verify ownership
		if (journal.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this journal entry");
		}

		return sendResponse(res, 200, true, "Journal entry retrieved successfully", journal);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: createJournalEntry
 * -------------------------------
 * Creates a new journal entry (Digital Garden flower) after a session.
 *
 * Workflow:
 * 1. Validates authentication and session existence.
 * 2. Verifies session ownership and no prior journal.
 * 3. Creates journal entry from validated request body.
 * 4. Handles optional photo/voice note uploads to Cloudinary.
 * 5. Auto-populates VK reflection from session data.
 * 6. Updates user's VK progression if readyForNextLevel flag set.
 * 7. Cleans up uploads on error, returns created entry.
 *
 * Validation:
 * - Required fields handled by middleware (moodBefore, moodAfter, energyLevel, stressLevel)
 * - Controller verifies: authenticated, sessionId provided, session exists, ownership
 *
 * Optional Fields in Request Body:
 * - physicalSensations, emotionalNotes, insights, gratitude
 * - vkReflection (or auto-populated from session)
 * - bodyAreas, favoritePoses, challengingPoses
 * - difficultyFeedback, pacingFeedback
 * - nextSessionGoals
 * - photos, voiceNotes (as file uploads)
 *
 * Error Handling:
 * - 400: Session already has journal
 * - 401: User not authenticated
 * - 403: Session belongs to different user
 * - 404: Session not found
 * - Files cleaned up on all errors
 *
 * Notes:
 * - Core of Digital Garden feature.
 * - Each entry becomes a "flower" in visualization.
 * - Anatomical observations drive recommendations.
 * - VK progression advances automatically when user marks ready.
 */
const createJournalEntry = async (req, res, next) => {
	let uploadedPhotos = [];
	let uploadedVoiceNotes = [];

	try {
		// session has been validated by middleware (required, valid ObjectId)
		// moodBefore, moodAfter, energyLevel, stressLevel validated by middleware
		const { session: sessionId } = req.body;

		// Verify session exists and belongs to user
		const session = await Session.findById(sessionId).populate("vkSequence");

		if (!session) {
			throw createError(404, "Session not found");
		}

		if (session.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this session");
		}

		// Check if journal already exists for this session
		const existingJournal = await JournalEntry.findOne({ session: sessionId });

		if (existingJournal) {
			throw createError(400, "A journal entry already exists for this session");
		}

		// Create journal entry
		const journalEntry = new JournalEntry({
			...req.body,
			user: req.user._id,
			session: sessionId,
		});

		// Explicitly reset media arrays — prevent body-injected photo/voiceNote objects
		// from bypassing the Cloudinary upload flow (req.body spread above would set them).
		journalEntry.photos = [];
		journalEntry.voiceNotes = [];

		// Handle photo uploads
		if (req.files?.photos && Array.isArray(req.files.photos)) {
			journalEntry.photos = req.files.photos.map((file) => ({
				url: file.path,
				cloudinaryId: file.filename,
				caption: "",
			}));
			uploadedPhotos = req.files.photos.map((f) => f.filename);
		}

		// Handle voice note uploads
		if (req.files?.voiceNotes && Array.isArray(req.files.voiceNotes)) {
			journalEntry.voiceNotes = req.files.voiceNotes.map((file) => ({
				url: file.path,
				cloudinaryId: file.filename,
				duration: parseInt(req.body.voiceNoteDuration, 10) || 0,
			}));
			uploadedVoiceNotes = req.files.voiceNotes.map((f) => f.filename);
		}

		// Auto-populate VK reflection data from session if not provided
		if (!journalEntry.vkReflection && session.vkSequence) {
			journalEntry.vkReflection = {
				sequenceFamily: session.vkSequence.family,
				sequenceLevel: session.vkSequence.level,
			};
		}

		const savedJournal = await journalEntry.save();

		// Update user's VK progression if ready for next level
		if (savedJournal.vkReflection?.readyForNextLevel && session.vkSequence) {
			try {
				await updateUserVKProgression(
					req.user._id,
					session.vkSequence.family,
					session.vkSequence.level,
					session.vkSequence._id,
				);
			} catch (progressError) {
				// Log but don't fail - journal is already saved
				console.error("Failed to update VK progression:", progressError);
			}
		}

		// Populate references before returning
		await savedJournal.populate("session");
		await savedJournal.populate("favoritePoses.pose");
		await savedJournal.populate("challengingPoses.pose");

		return sendResponse(res, 201, true, "Journal entry created successfully", savedJournal);
	} catch (error) {
		// Clean up uploaded files on error
		if (uploadedPhotos.length > 0 || uploadedVoiceNotes.length > 0) {
			try {
				for (const photoId of uploadedPhotos) {
					await deleteImgCloudinary(photoId);
				}
				for (const voiceId of uploadedVoiceNotes) {
					await deleteImgCloudinary(voiceId);
				}
			} catch (cleanupError) {
				console.error("File cleanup failed:", cleanupError);
			}
		}
		return next(error);
	}
};

/**
 * Controller: updateJournalEntry
 * -------------------------------
 * Updates an existing journal entry.
 *
 * Workflow:
 * 1. Finds journal by ID.
 * 2. Verifies ownership.
 * 3. Updates allowed fields.
 * 4. Handles new photo/voice note uploads.
 * 5. Returns updated journal.
 *
 * Updatable Fields:
 * - All reflection fields (mood, energy, stress, notes, etc.)
 * - Can add/remove photos and voice notes
 * - Can update vkReflection data
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Journal belongs to different user
 * - 404: Journal not found
 * - Image cleanup on error
 *
 * Notes:
 * - Users may want to update reflections after initial save.
 * - Photos/voice notes are additive (doesn't delete existing).
 */
const updateJournalEntry = async (req, res, next) => {
	let uploadedPhotos = [];
	let uploadedVoiceNotes = [];

	try {
		// req.user verified by authenticateToken middleware
		const { id } = req.params;

		const journal = await JournalEntry.findById(id);

		if (!journal) {
			throw createError(404, "Journal entry not found");
		}

		// Verify ownership
		if (journal.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this journal entry");
		}

		// Update allowed fields (exclude session and user)
		const allowedUpdates = [
			"moodBefore",
			"moodAfter",
			"signalAfter",
			"energyLevel",
			"stressLevel",
			"physicalSensations",
			"bodyAreas",
			"emotionalNotes",
			"insights",
			"gratitude",
			"favoritePoses",
			"challengingPoses",
			"difficultyFeedback",
			"pacingFeedback",
			"vkReflection",
			"nextSessionGoals",
			"tags",
		];

		allowedUpdates.forEach((field) => {
			if (req.body[field] !== undefined) {
				journal[field] = req.body[field];
			}
		});

		// Handle new photo uploads (additive)
		if (req.files?.photos && Array.isArray(req.files.photos)) {
			const newPhotos = req.files.photos.map((file) => ({
				url: file.path,
				cloudinaryId: file.filename,
				caption: "",
			}));
			journal.photos = [...journal.photos, ...newPhotos];
			uploadedPhotos = req.files.photos.map((f) => f.filename);
		}

		// Handle new voice note uploads (additive)
		if (req.files?.voiceNotes && Array.isArray(req.files.voiceNotes)) {
			const newVoiceNotes = req.files.voiceNotes.map((file) => ({
				url: file.path,
				cloudinaryId: file.filename,
				duration: parseInt(req.body.voiceNoteDuration, 10) || 0,
			}));
			journal.voiceNotes = [...journal.voiceNotes, ...newVoiceNotes];
			uploadedVoiceNotes = req.files.voiceNotes.map((f) => f.filename);
		}

		const updatedJournal = await journal.save();

		// Trigger VK progression if readyForNextLevel was set via this update
		if (updatedJournal.vkReflection?.readyForNextLevel) {
			try {
				const populatedSession = await Session.findById(updatedJournal.session).populate(
					"vkSequence",
				);
				if (populatedSession?.vkSequence) {
					await updateUserVKProgression(
						req.user._id,
						populatedSession.vkSequence.family,
						populatedSession.vkSequence.level,
						populatedSession.vkSequence._id,
					);
				}
			} catch (progressError) {
				// Log but don't fail — journal update is already saved
				console.error("Failed to update VK progression:", progressError);
			}
		}

		await updatedJournal.populate("session");
		await updatedJournal.populate("favoritePoses.pose");
		await updatedJournal.populate("challengingPoses.pose");

		return sendResponse(res, 200, true, "Journal entry updated successfully", updatedJournal);
	} catch (error) {
		// Clean up newly uploaded files on error
		if (uploadedPhotos.length > 0 || uploadedVoiceNotes.length > 0) {
			try {
				for (const photoId of uploadedPhotos) {
					await deleteImgCloudinary(photoId);
				}
				for (const voiceId of uploadedVoiceNotes) {
					await deleteImgCloudinary(voiceId);
				}
			} catch (cleanupError) {
				console.error("File cleanup failed:", cleanupError);
			}
		}
		return next(error);
	}
};

/**
 * Controller: deleteJournalEntry
 * -------------------------------
 * Deletes a journal entry and all associated media from Cloudinary.
 *
 * Workflow:
 * 1. Finds journal by ID.
 * 2. Verifies user authentication and ownership.
 * 3. Deletes all photos from Cloudinary (continues even if one fails).
 * 4. Deletes all voice notes from Cloudinary (continues even if one fails).
 * 5. Deletes journal document from database.
 * 6. Returns success response.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Journal belongs to different user
 * - 404: Journal not found
 * - File deletion errors logged but don't prevent journal deletion
 *
 * Notes:
 * - Cascade cleanup of Cloudinary files ensures no orphaned media.
 * - Session remains intact (journal is optional relationship).
 * - Failed file deletions are logged; journal deletion continues.
 */
const deleteJournalEntry = async (req, res, next) => {
	try {
		// req.user verified by authenticateToken middleware
		const { id } = req.params;

		const journal = await JournalEntry.findById(id);

		if (!journal) {
			throw createError(404, "Journal entry not found");
		}

		// Verify ownership
		if (journal.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this journal entry");
		}

		// Delete photos from Cloudinary (continue even if some fail)
		for (const photo of journal.photos) {
			try {
				if (photo.cloudinaryId) {
					await deleteImgCloudinary(photo.cloudinaryId);
				}
			} catch (photoError) {
				console.error("Failed to delete photo:", photoError);
			}
		}

		// Delete voice notes from Cloudinary (continue even if some fail)
		for (const voiceNote of journal.voiceNotes) {
			try {
				if (voiceNote.cloudinaryId) {
					await deleteImgCloudinary(voiceNote.cloudinaryId);
				}
			} catch (voiceError) {
				console.error("Failed to delete voice note:", voiceError);
			}
		}

		await JournalEntry.findByIdAndDelete(id);

		return sendResponse(res, 200, true, "Journal entry deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

/**
 * Helper Function: updateUserVKProgression
 * -----------------------------------------
 * Updates user's VK progression when they're ready for next level.
 *
 * Workflow:
 * 1. Finds user by ID.
 * 2. Marks current sequence as completed (increments sessionCount if repeated).
 * 3. Unlocks family if first completion.
 * 4. For levels 1-2: finds and assigns next level as currentMainSequence.
 * 5. Saves user document.
 *
 * Error Handling:
 * - Throws if user not found or save fails.
 * - Caught and logged in controller (doesn't fail journal save).
 */
async function updateUserVKProgression(userId, family, level, sequenceId) {
	const user = await User.findById(userId);

	if (!user) {
		throw createError(404, "User not found");
	}

	// Mark sequence as completed (uses built-in method)
	await user.markSequenceCompleted(family, level, sequenceId);

	// Unlock next level if this was level 1 or 2
	if (level < 3) {
		// Find next level sequence
		const nextSequence = await VKSequence.findOne({
			family,
			level: level + 1,
		});

		if (nextSequence) {
			user.vkProgression.currentMainSequence = {
				family,
				level: level + 1,
				sequenceId: nextSequence._id,
			};
			await user.save();
		}
	}
}

/**
 * Helper: calculateEmotionalTrends
 * ---------------------------------
 * Computes aggregate emotional metrics from journal entries.
 *
 * Returns:
 * - avgEnergyImprovement: Average energy gain (after - before)
 * - avgStressReduction: Average stress decrease (before - after)
 * - mostCommonMoodBefore: Most frequently reported pre-practice mood
 * - mostCommonMoodAfter: Most frequently reported post-practice mood
 *
 * Returns null if no entries provided.
 */
function _calculateEmotionalTrends(journals) {
	if (!journals || journals.length === 0) return null;

	const trends = {
		avgEnergyImprovement: 0,
		avgStressReduction: 0,
		mostCommonMoodBefore: null,
		mostCommonMoodAfter: null,
	};

	let totalEnergyChange = 0;
	let totalStressChange = 0;
	const moodBeforeCount = {};
	const moodAfterCount = {};

	journals.forEach((j) => {
		if (j.energyLevel && j.stressLevel) {
			totalEnergyChange += j.energyLevel.after - j.energyLevel.before;
			totalStressChange += j.stressLevel.before - j.stressLevel.after;
		}

		if (Array.isArray(j.moodBefore)) {
			j.moodBefore.forEach((mood) => {
				moodBeforeCount[mood] = (moodBeforeCount[mood] || 0) + 1;
			});
		}

		if (Array.isArray(j.moodAfter)) {
			j.moodAfter.forEach((mood) => {
				moodAfterCount[mood] = (moodAfterCount[mood] || 0) + 1;
			});
		}
	});

	trends.avgEnergyImprovement = (totalEnergyChange / journals.length).toFixed(1);
	trends.avgStressReduction = (totalStressChange / journals.length).toFixed(1);

	if (Object.keys(moodBeforeCount).length > 0) {
		trends.mostCommonMoodBefore = Object.keys(moodBeforeCount).reduce((a, b) =>
			moodBeforeCount[a] > moodBeforeCount[b] ? a : b,
		);
	}

	if (Object.keys(moodAfterCount).length > 0) {
		trends.mostCommonMoodAfter = Object.keys(moodAfterCount).reduce((a, b) =>
			moodAfterCount[a] > moodAfterCount[b] ? a : b,
		);
	}

	return trends;
}

/**
 * Helper: calculatePhysicalProgress
 * ----------------------------------
 * Aggregates physical improvements across all journal entries.
 *
 * Returns object keyed by body area with:
 * - observations: total number of observations for that area
 * - improvements: number with any improvement recorded
 * - significant: count of significant improvements
 * - moderate: count of moderate improvements
 * - slight: count of slight improvements
 *
 * Used to visualize which body areas show the most development.
 */
function _calculatePhysicalProgress(journals) {
	const bodyAreaProgress = {};

	if (!Array.isArray(journals)) return bodyAreaProgress;

	journals.forEach((journal) => {
		if (journal.vkReflection && Array.isArray(journal.vkReflection.anatomicalObservations)) {
			journal.vkReflection.anatomicalObservations.forEach((obs) => {
				if (!obs.area) return; // Skip if no area specified

				if (!bodyAreaProgress[obs.area]) {
					bodyAreaProgress[obs.area] = {
						observations: 0,
						improvements: 0,
						significant: 0,
						moderate: 0,
						slight: 0,
					};
				}

				bodyAreaProgress[obs.area].observations++;

				if (obs.improvement && obs.improvement !== "none" && obs.improvement !== "regressed") {
					bodyAreaProgress[obs.area].improvements++;
					if (bodyAreaProgress[obs.area][obs.improvement] !== undefined) {
						bodyAreaProgress[obs.area][obs.improvement]++;
					}
				}
			});
		}
	});

	return bodyAreaProgress;
}

/**
 * Controller: completeJournalEntry
 * --------------------------------
 * Promotes a "before" stub journal entry into a fully completed entry by
 * patching post-practice fields and flipping `phase` to "completed".
 *
 * Endpoint: PATCH /api/v1/journal-entries/:id/complete
 *
 * Workflow:
 * 1. Load the journal entry and verify ownership.
 * 2. Reject if already completed (use PUT /:id for further edits).
 * 3. Apply post-practice fields from req.body.
 * 4. Set phase to "completed" and save (triggers full validation).
 */
const completeJournalEntry = async (req, res, next) => {
	try {
		const { id } = req.params;
		const journal = await JournalEntry.findById(id);

		if (!journal) {
			throw createError(404, "Journal entry not found");
		}
		if (journal.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this journal entry");
		}
		if (journal.phase === "completed") {
			throw createError(400, "Journal entry is already completed");
		}

		const completionFields = [
			"moodAfter",
			"signalAfter",
			"energyLevel",
			"stressLevel",
			"physicalSensations",
			"bodyAreas",
			"emotionalNotes",
			"insights",
			"gratitude",
			"favoritePoses",
			"challengingPoses",
			"difficultyFeedback",
			"pacingFeedback",
			"vkReflection",
			"nextSessionGoals",
			"tags",
		];

		completionFields.forEach((field) => {
			if (req.body[field] !== undefined) {
				if (
					(field === "energyLevel" || field === "stressLevel") &&
					typeof req.body[field] === "object"
				) {
					// Merge before/after so we don't drop the check-in values.
					journal[field] = {
						...journal[field]?.toObject?.(),
						...req.body[field],
					};
				} else {
					journal[field] = req.body[field];
				}
			}
		});

		journal.phase = "completed";
		const completedJournal = await journal.save();
		await completedJournal.populate("session", "sessionType duration");

		return sendResponse(res, 200, true, "Journal entry completed successfully", completedJournal);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createJournalEntry,
	getJournalEntries,
	getJournalEntryById,
	updateJournalEntry,
	deleteJournalEntry,
	completeJournalEntry,
};

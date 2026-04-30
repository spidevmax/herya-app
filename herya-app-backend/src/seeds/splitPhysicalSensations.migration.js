/**
 * One-shot migration: convert legacy `physicalSensations` string fields on
 * JournalEntry documents into arrays of tags.
 *
 * Run with: node src/seeds/splitPhysicalSensations.migration.js
 *
 * Safe to run multiple times — only touches documents whose value is still a
 * string. After all envs have been migrated, the pre-validate normalizer in
 * the model can be removed.
 */
require("dotenv").config();

const mongoose = require("mongoose");
const { connectDB } = require("../config/db");

(async () => {
	await connectDB();
	const JournalEntry = mongoose.model("JournalEntry");

	// Use the raw collection to find string values — Mongoose has already coerced
	// the field to [String] in its in-memory schema.
	const cursor = JournalEntry.collection.find({
		physicalSensations: { $type: "string" },
	});

	let scanned = 0;
	let updated = 0;
	for await (const doc of cursor) {
		scanned++;
		const tags = String(doc.physicalSensations)
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
		await JournalEntry.collection.updateOne(
			{ _id: doc._id },
			{ $set: { physicalSensations: tags } },
		);
		updated++;
	}

	console.log(`Scanned ${scanned} legacy entries, updated ${updated}.`);
	await mongoose.disconnect();
	process.exit(0);
})();

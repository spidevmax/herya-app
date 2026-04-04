import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Leaf, RotateCcw, Settings2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
	createSession,
	startSessionTimer,
	completeGuidedSession,
	abandonSession,
} from "@/api/sessions.api";
import { getSequenceById } from "@/api/sequences.api";
import { getBreathingPatternById } from "@/api/breathing.api";
import { createJournalEntry } from "@/api/journalEntries.api";
import { getJournalEntries } from "@/api/journalEntries.api";
import useSessionPersistence from "@/hooks/useSessionPersistence";
import PracticeTypeSelector from "@/components/session/PracticeTypeSelector";
import SessionBuilder from "@/components/session/SessionBuilder";
import GuidedPracticePlayer from "@/components/session/GuidedPracticePlayer";
import PostPracticeJournal from "@/components/session/PostPracticeJournal";
import { Button } from "@/components/ui";
import { GARDEN_MOOD_ORDER, MOOD_COLORS } from "@/utils/constants";

const getMoodColor = (mood) => MOOD_COLORS[mood] || "var(--color-primary)";
const PRACTICE_PRESETS = {
	ADULT: "adult",
	TUTOR: "tutor",
};
const TUTOR_MAX_TOTAL_MINUTES = 12;
const TUTOR_SIGNAL_MAP = {
	green: { mood: ["calm"], energy: 4 },
	yellow: { mood: ["focused"], energy: 5 },
	red: { mood: ["anxious"], energy: 7 },
};
const SIGNAL_SCORES = {
	green: 2,
	yellow: 1,
	red: 0,
};

const inferSignalFromJournal = (journal) => {
	if (!journal) return "yellow";

	if (journal.signalAfter && SIGNAL_SCORES[journal.signalAfter] !== undefined) {
		return journal.signalAfter;
	}

	const stressAfter = Number(journal?.stressLevel?.after || 5);
	const moods = Array.isArray(journal?.moodAfter)
		? journal.moodAfter
		: Array.isArray(journal?.moodBefore)
			? journal.moodBefore
			: [];

	if (
		stressAfter >= 7 ||
		moods.some((mood) =>
			[
				"anxious",
				"overwhelmed",
				"stressed",
				"restless",
				"discouraged",
			].includes(mood),
		)
	) {
		return "red";
	}

	if (
		stressAfter <= 4 &&
		moods.some((mood) =>
			["calm", "peaceful", "grounded", "centered", "clear"].includes(mood),
		)
	) {
		return "green";
	}

	return "yellow";
};

const getRecommendationFromRecentJournals = (journals = []) => {
	if (!Array.isArray(journals) || journals.length === 0) {
		return {
			preset: PRACTICE_PRESETS.ADULT,
			reasonKey: "practice.reco_reason_default",
		};
	}

	const last = journals.slice(0, 6);
	const counts = { green: 0, yellow: 0, red: 0 };
	let stressTotal = 0;

	for (const journal of last) {
		const signal = inferSignalFromJournal(journal);
		counts[signal] += 1;
		stressTotal += Number(journal?.stressLevel?.after || 5);
	}

	const avgStress = stressTotal / last.length;

	if (counts.red >= 2 || avgStress >= 7) {
		return {
			preset: PRACTICE_PRESETS.TUTOR,
			reasonKey: "practice.reco_reason_red",
		};
	}

	if (counts.yellow >= 3 || counts.yellow > counts.green) {
		return {
			preset: PRACTICE_PRESETS.TUTOR,
			reasonKey: "practice.reco_reason_yellow",
		};
	}

	return {
		preset: PRACTICE_PRESETS.ADULT,
		reasonKey: "practice.reco_reason_green",
	};
};

/**
 * StartPractice — 4-phase flow:
 * 1. Choose type (PracticeTypeSelector)
 * 2. Build session (SessionBuilder)
 * 3. Execute guided (GuidedPracticePlayer)
 * 4. Post-practice journal (PostPracticeJournal)
 */
export default function StartPractice() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const { user, refreshUser } = useAuth();
	const { t } = useLanguage();
	const persistence = useSessionPersistence();

	const navigationResumeSession = useMemo(() => {
		const candidate = location.state?.resumeSession;
		if (!candidate?._id || !Array.isArray(candidate?.plannedBlocks)) {
			return null;
		}

		if (candidate.plannedBlocks.length === 0) {
			return null;
		}

		const totalMinutes =
			Number(candidate.duration) ||
			candidate.plannedBlocks.reduce(
				(sum, block) => sum + (Number(block.durationMinutes) || 0),
				0,
			);

		return {
			sessionId: candidate._id,
			practiceType: candidate.sessionType || "vk_sequence",
			blocks: candidate.plannedBlocks,
			totalMinutes,
		};
	}, [location.state]);
	const hasNavigationResume = Boolean(navigationResumeSession);
	const isTutorUser = user?.role === "tutor";
	const dashboardSuggestedPreset =
		location.state?.suggestedPreset === PRACTICE_PRESETS.ADULT ||
		(isTutorUser && location.state?.suggestedPreset === PRACTICE_PRESETS.TUTOR)
			? location.state?.suggestedPreset
			: null;
	const dashboardSuggestedRecommendation =
		location.state?.suggestedRecommendation &&
		typeof location.state.suggestedRecommendation === "object"
			? location.state.suggestedRecommendation
			: null;

	const prefilledType = searchParams.get("type");
	const prefilledSequenceId = searchParams.get("seq");
	const hasPrefilledSequence =
		prefilledType === "vk_sequence" && Boolean(prefilledSequenceId);
	const prefilledMinutes = Number(searchParams.get("minutes")) || 15;

	// Flow phase: "type" | "build" | "checkin" | "practice" | "journal" | "done"
	const [phase, setPhase] = useState(() =>
		hasNavigationResume ? "practice" : hasPrefilledSequence ? "build" : "type",
	);
	const [practiceType, setPracticeType] = useState(() =>
		hasNavigationResume
			? navigationResumeSession.practiceType
			: hasPrefilledSequence
				? "vk_sequence"
				: null,
	);
	const [blocks, setBlocks] = useState(() =>
		hasNavigationResume ? navigationResumeSession.blocks : [],
	);
	const [totalMinutes, setTotalMinutes] = useState(() =>
		hasNavigationResume ? navigationResumeSession.totalMinutes : 0,
	);
	const [sessionId, setSessionId] = useState(() =>
		hasNavigationResume ? navigationResumeSession.sessionId : null,
	);
	const [sessionSummary, setSessionSummary] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	// Guided data: fetched sequence/pattern objects keyed by ID
	const [sequencesData, setSequencesData] = useState({});
	const [patternsData, setPatternsData] = useState({});

	// Check-in state (optional)
	const [checkInEnabled, setCheckInEnabled] = useState(false);
	const [lowStimMode, setLowStimMode] = useState(() =>
		Boolean(user?.preferences?.lowStimMode),
	);
	const [practicePreset, setPracticePreset] = useState(() =>
		user?.role === "tutor" ? PRACTICE_PRESETS.TUTOR : PRACTICE_PRESETS.ADULT,
	);
	const isTutorPractice =
		isTutorUser && practicePreset === PRACTICE_PRESETS.TUTOR;
	const [checkInMood, setCheckInMood] = useState([]);
	const [checkInEnergy, setCheckInEnergy] = useState(5);
	const [checkInIntention, setCheckInIntention] = useState("");
	const [tutorSignal, setTutorSignal] = useState("yellow");
	const [recommendedPreset, setRecommendedPreset] = useState(null);
	const [recommendationReasonKey, setRecommendationReasonKey] = useState(
		"practice.reco_reason_default",
	);
	const [hasManualPresetChoice, setHasManualPresetChoice] = useState(false);
	const [recommendationApplied, setRecommendationApplied] = useState(false);
	const [dashboardPresetApplied, setDashboardPresetApplied] = useState(false);

	useEffect(() => {
		if (user?.preferences?.lowStimMode === undefined) return;
		setLowStimMode(Boolean(user.preferences.lowStimMode));
	}, [user?.preferences?.lowStimMode]);

	useEffect(() => {
		setPracticePreset(
			isTutorUser ? PRACTICE_PRESETS.TUTOR : PRACTICE_PRESETS.ADULT,
		);
	}, [isTutorUser]);

	useEffect(() => {
		let mounted = true;

		if (!isTutorUser) {
			setRecommendedPreset(PRACTICE_PRESETS.ADULT);
			setRecommendationReasonKey("practice.reco_reason_default");
			return () => {
				mounted = false;
			};
		}

		getJournalEntries({ limit: 8 })
			.then((response) => {
				if (!mounted) return;
				const payload = response?.data?.data || response?.data || {};
				const journals = Array.isArray(payload)
					? payload
					: payload.journals || [];
				const recommendation = getRecommendationFromRecentJournals(journals);

				setRecommendedPreset(recommendation.preset);
				setRecommendationReasonKey(recommendation.reasonKey);
			})
			.catch(() => {
				if (!mounted) return;
				setRecommendedPreset(PRACTICE_PRESETS.ADULT);
				setRecommendationReasonKey("practice.reco_reason_default");
			});

		return () => {
			mounted = false;
		};
	}, [isTutorUser]);

	const adaptBlocksForTutorPreset = useCallback((sourceBlocks) => {
		let remaining = TUTOR_MAX_TOTAL_MINUTES;
		const adapted = [];

		for (const block of sourceBlocks) {
			if (remaining <= 0) break;

			const baseDuration = Math.max(1, Number(block.durationMinutes) || 5);
			const blockCap =
				block.blockType === "meditation"
					? 5
					: block.blockType === "pranayama"
						? 6
						: 6;
			const nextDuration = Math.min(baseDuration, blockCap, remaining);

			const nextBlock = {
				...block,
				durationMinutes: Math.max(1, nextDuration),
				config: {
					...block.config,
					...(block.blockType === "pranayama"
						? {
								lowStim: true,
								cycles: Math.min(6, Number(block.config?.cycles) || 6),
							}
						: {}),
				},
			};

			adapted.push(nextBlock);
			remaining -= nextBlock.durationMinutes;
		}

		if (adapted.length === 0 && sourceBlocks.length > 0) {
			const first = sourceBlocks[0];
			adapted.push({
				...first,
				durationMinutes: Math.min(
					5,
					Math.max(1, Number(first.durationMinutes) || 5),
				),
				config: {
					...first.config,
					...(first.blockType === "pranayama"
						? { lowStim: true, cycles: 6 }
						: {}),
				},
			});
		}

		return adapted;
	}, []);

	const adaptBlocksForTutorSignal = useCallback((sourceBlocks, signal) => {
		if (!Array.isArray(sourceBlocks) || sourceBlocks.length === 0) {
			return [];
		}

		if (signal === "green") {
			return sourceBlocks;
		}

		if (signal === "red") {
			let remaining = 5;
			const selected = [];
			const preferredOrder = ["pranayama", "meditation", "vk_sequence"];

			for (const type of preferredOrder) {
				const candidate = sourceBlocks.find(
					(block) => block.blockType === type && !selected.includes(block),
				);
				if (candidate) selected.push(candidate);
				if (selected.length >= 2) break;
			}

			if (selected.length === 0) selected.push(sourceBlocks[0]);

			const adapted = [];
			for (const block of selected) {
				if (remaining <= 0) break;

				const cap = block.blockType === "vk_sequence" ? 2 : 3;
				const nextDuration = Math.min(
					Math.max(1, Number(block.durationMinutes) || 3),
					cap,
					remaining,
				);

				adapted.push({
					...block,
					durationMinutes: nextDuration,
					config: {
						...block.config,
						...(block.blockType === "pranayama"
							? {
									lowStim: true,
									cycles: Math.min(4, Number(block.config?.cycles) || 4),
								}
							: {}),
					},
				});

				remaining -= nextDuration;
			}

			return adapted;
		}

		let remaining = 8;
		const adapted = [];

		for (const block of sourceBlocks) {
			if (remaining <= 0 || adapted.length >= 3) break;

			const cap = block.blockType === "vk_sequence" ? 4 : 5;
			const nextDuration = Math.min(
				Math.max(1, Number(block.durationMinutes) || 4),
				cap,
				remaining,
			);

			adapted.push({
				...block,
				durationMinutes: nextDuration,
				config: {
					...block.config,
					...(block.blockType === "pranayama"
						? {
								lowStim: true,
								cycles: Math.min(5, Number(block.config?.cycles) || 5),
							}
						: {}),
				},
			});

			remaining -= nextDuration;
		}

		return adapted.length > 0 ? adapted : sourceBlocks.slice(0, 1);
	}, []);

	const applyPracticePreset = useCallback(
		(preset) => {
			const nextPreset =
				!isTutorUser && preset === PRACTICE_PRESETS.TUTOR
					? PRACTICE_PRESETS.ADULT
					: preset;

			setPracticePreset(nextPreset);

			if (nextPreset === PRACTICE_PRESETS.TUTOR) {
				setLowStimMode(true);
				setCheckInEnabled(true);
				setTutorSignal("yellow");
				setCheckInMood(TUTOR_SIGNAL_MAP.yellow.mood);
				setCheckInEnergy(TUTOR_SIGNAL_MAP.yellow.energy);
				setCheckInIntention("");
				return;
			}

			setLowStimMode(false);
		},
		[isTutorUser],
	);

	useEffect(() => {
		if (phase !== "build") return;
		if (!isTutorUser) return;
		if (hasManualPresetChoice || recommendationApplied) return;
		if (recommendedPreset !== PRACTICE_PRESETS.TUTOR) return;

		applyPracticePreset(PRACTICE_PRESETS.TUTOR);
		setRecommendationApplied(true);
	}, [
		applyPracticePreset,
		hasManualPresetChoice,
		isTutorUser,
		phase,
		recommendationApplied,
		recommendedPreset,
	]);

	useEffect(() => {
		if (phase !== "build") return;
		if (!dashboardSuggestedPreset) return;
		if (dashboardPresetApplied) return;

		applyPracticePreset(dashboardSuggestedPreset);
		setHasManualPresetChoice(true);
		setRecommendationApplied(true);
		setDashboardPresetApplied(true);
	}, [
		applyPracticePreset,
		dashboardPresetApplied,
		dashboardSuggestedPreset,
		phase,
	]);

	// Recovery banner
	const [showRecovery, setShowRecovery] = useState(
		!hasNavigationResume && !!persistence.recovered,
	);
	const [hasHydratedNavigationResume, setHasHydratedNavigationResume] =
		useState(false);
	const [initialBuilderBlocks] = useState(() =>
		hasPrefilledSequence
			? [
					{
						blockType: "vk_sequence",
						durationMinutes: prefilledMinutes,
						vkSequence: prefilledSequenceId,
						guided: true,
						level: "beginner",
					},
				]
			: [],
	);

	// Fetch full sequence/pattern data for guided blocks before starting practice
	const fetchGuidedData = useCallback(async (orderedBlocks) => {
		const seqIds = [
			...new Set(
				orderedBlocks
					.filter(
						(b) => b.blockType === "vk_sequence" && b.guided && b.vkSequence,
					)
					.map((b) => b.vkSequence),
			),
		];
		const patIds = [
			...new Set(
				orderedBlocks
					.filter(
						(b) =>
							b.blockType === "pranayama" && b.guided && b.breathingPattern,
					)
					.map((b) => b.breathingPattern),
			),
		];

		const results = await Promise.allSettled([
			...seqIds.map((id) =>
				getSequenceById(id).then((r) => ({
					type: "sequence",
					id,
					data: r.data?.data || r.data,
				})),
			),
			...patIds.map((id) =>
				getBreathingPatternById(id).then((r) => ({
					type: "pattern",
					id,
					data: r.data?.data || r.data,
				})),
			),
		]);

		const seqs = {};
		const pats = {};
		for (const result of results) {
			if (result.status === "fulfilled") {
				const { type, id, data } = result.value;
				if (type === "sequence") seqs[id] = data;
				else pats[id] = data;
			}
		}
		setSequencesData(seqs);
		setPatternsData(pats);
	}, []);

	const handleSelectType = (type) => {
		setPracticeType(type);
		setPhase("build");
	};

	const handleStartSession = async (orderedBlocks, minutes) => {
		const normalizedBlocks = orderedBlocks.map((block) => ({
			...block,
			config:
				block.blockType === "pranayama"
					? {
							...block.config,
							lowStim: lowStimMode,
						}
					: block.config,
		}));

		const preparedBlocks = isTutorPractice
			? adaptBlocksForTutorPreset(normalizedBlocks)
			: normalizedBlocks;
		const preparedMinutes = preparedBlocks.reduce(
			(sum, block) => sum + (Number(block.durationMinutes) || 0),
			0,
		);

		setBlocks(preparedBlocks);
		setTotalMinutes(preparedMinutes || minutes);

		if (checkInEnabled) {
			setPhase("checkin");
		} else {
			await createAndStartSession(
				preparedBlocks,
				preparedMinutes || minutes,
				null,
			);
		}
	};

	const handleCheckInComplete = async () => {
		const signalPreset =
			TUTOR_SIGNAL_MAP[tutorSignal] || TUTOR_SIGNAL_MAP.yellow;
		const adaptedBlocksForSignal = isTutorPractice
			? adaptBlocksForTutorSignal(blocks, tutorSignal)
			: blocks;
		const adaptedMinutesForSignal = adaptedBlocksForSignal.reduce(
			(sum, block) => sum + (Number(block.durationMinutes) || 0),
			0,
		);
		const normalizedMood = isTutorPractice ? signalPreset.mood : checkInMood;
		const normalizedEnergy = isTutorPractice
			? signalPreset.energy
			: checkInEnergy;

		const checkIn = {
			enabled: true,
			mood: normalizedMood,
			energyLevel: normalizedEnergy,
			signal: isTutorPractice ? tutorSignal : null,
			intention: isTutorPractice ? "tutor-guided" : checkInIntention,
		};

		if (isTutorPractice) {
			setBlocks(adaptedBlocksForSignal);
			setTotalMinutes(adaptedMinutesForSignal);
		}

		await createAndStartSession(
			adaptedBlocksForSignal,
			adaptedMinutesForSignal || totalMinutes,
			checkIn,
		);
	};

	const createAndStartSession = async (orderedBlocks, minutes, checkIn) => {
		setError(null);
		try {
			// Fetch guided data in parallel with session creation
			const [, sessionRes] = await Promise.all([
				fetchGuidedData(orderedBlocks),
				(async () => {
					const recommendationContext =
						location.state?.fromDashboardTutorInsights &&
						dashboardSuggestedPreset
							? {
									applied: true,
									source: "dashboard_tutor_insights",
									preset: dashboardSuggestedPreset,
									key: dashboardSuggestedRecommendation?.key,
									confidence: dashboardSuggestedRecommendation?.confidence,
									appliedAt: new Date().toISOString(),
								}
							: null;

					const payload = {
						sessionType: practiceType,
						duration: minutes,
						plannedBlocks: orderedBlocks,
						status: "planned",
						...(checkIn ? { checkIn } : {}),
						...(recommendationContext ? { recommendationContext } : {}),
					};

					const res = await createSession(payload);
					const session = res.data?.data || res.data;
					const id = session._id;
					setSessionId(id);

					await startSessionTimer(id);
					return { id };
				})(),
			]);

			persistence.saveSession({
				sessionId: sessionRes.id,
				practiceType,
				blocks: orderedBlocks,
				totalMinutes: minutes,
				phase: "practice",
			});

			setPhase("practice");
		} catch (err) {
			console.error("Failed to create session:", err);
			setError(t("practice.error_create_session"));
		}
	};

	const handleSaveProgress = useCallback(
		(progressData) => {
			persistence.saveSession({
				sessionId,
				practiceType,
				blocks,
				totalMinutes,
				phase: "practice",
				...progressData,
			});
		},
		[sessionId, practiceType, blocks, totalMinutes, persistence],
	);

	const handleComplete = async (summary) => {
		setSessionSummary(summary);
		try {
			if (sessionId) {
				await completeGuidedSession(sessionId, {
					blocksCompleted: summary.blocksCompleted,
					tutorSupport: summary.tutorSupport,
				});
			}
		} catch (err) {
			console.error("Failed to complete session:", err);
		}
		persistence.clearSession();
		setPhase("journal");
	};

	const handleAbandon = async (summary) => {
		setSessionSummary(summary);
		try {
			if (sessionId) {
				await abandonSession(sessionId, {
					tutorSupport: summary.tutorSupport,
				});
			}
		} catch (err) {
			console.error("Failed to abandon session:", err);
		}
		persistence.clearSession();
		// Still show journal even on abandon
		setPhase("journal");
	};

	const handleSaveJournal = async (journalData) => {
		setSaving(true);
		try {
			if (sessionId) {
				await createJournalEntry({
					session: sessionId,
					...journalData,
				});
			}
			await refreshUser();
			persistence.clearSession();
			setPhase("done");
		} catch (err) {
			console.error("Failed to save journal:", err);
			setError(t("practice.error_save_journal"));
		} finally {
			setSaving(false);
		}
	};

	const handleRecoverSession = useCallback(async () => {
		const r = persistence.recovered;
		if (!r) return;
		setPracticeType(r.practiceType);
		setBlocks(r.blocks || []);
		setTotalMinutes(r.totalMinutes || 0);
		setSessionId(r.sessionId);

		// Fetch guided data for recovered blocks
		await fetchGuidedData(r.blocks || []);

		setPhase("practice");
		setShowRecovery(false);
	}, [persistence.recovered, fetchGuidedData]);

	useEffect(() => {
		if (!hasNavigationResume || hasHydratedNavigationResume) return;

		fetchGuidedData(navigationResumeSession.blocks);
		persistence.saveSession({
			sessionId: navigationResumeSession.sessionId,
			practiceType: navigationResumeSession.practiceType,
			blocks: navigationResumeSession.blocks,
			totalMinutes: navigationResumeSession.totalMinutes,
			phase: "practice",
		});
		setHasHydratedNavigationResume(true);
	}, [
		fetchGuidedData,
		hasHydratedNavigationResume,
		hasNavigationResume,
		navigationResumeSession,
		persistence,
	]);

	const toggleCheckInMood = (mood) => {
		setCheckInMood((prev) =>
			prev.includes(mood)
				? prev.filter((m) => m !== mood)
				: prev.length < 3
					? [...prev, mood]
					: prev,
		);
	};

	const handleTutorSignalChange = (signal) => {
		setTutorSignal(signal);
		const preset = TUTOR_SIGNAL_MAP[signal] || TUTOR_SIGNAL_MAP.yellow;
		setCheckInMood(preset.mood);
		setCheckInEnergy(preset.energy);
	};

	// Done screen
	if (phase === "done") {
		return (
			<div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
					className="flex justify-center"
				>
					<Leaf
						size={64}
						strokeWidth={2.2}
						style={{ color: "var(--color-primary)" }}
					/>
				</motion.div>
				<h2
					className="text-2xl font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("practice.done_title")}
				</h2>
				<p
					className="text-sm text-center"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("practice.done_subtitle")}
				</p>
				<div className="flex gap-3">
					<Button variant="outline" onClick={() => navigate("/sessions")}>
						{t("practice.view_history")}
					</Button>
					<Button onClick={() => navigate("/")}>
						{t("session.back_home")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col min-h-dvh">
			{/* Header */}
			<div
				className="sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center gap-3 backdrop-blur-xl"
				style={{
					backgroundColor:
						"color-mix(in srgb, var(--color-surface) 90%, transparent)",
				}}
			>
				<button
					type="button"
					onClick={() => {
						if (phase === "build") setPhase("type");
						else if (phase === "checkin") setPhase("build");
						else if (phase === "type") navigate(-1);
						else navigate("/");
					}}
					className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
				</button>
				<h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
					{phase === "type"
						? t("practice.start_practice")
						: phase === "build"
							? t("practice.build_session")
							: phase === "checkin"
								? t("practice.check_in")
								: phase === "practice"
									? t("practice.in_progress")
									: t("practice.journal")}
				</h1>

				{/* Check-in toggle (visible in build phase) */}
				{phase === "build" && (
					<button
						type="button"
						onClick={() => setCheckInEnabled((e) => !e)}
						className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition"
						style={{
							backgroundColor: checkInEnabled
								? "var(--color-primary)"
								: "var(--color-surface-card)",
							color: checkInEnabled ? "white" : "var(--color-text-secondary)",
							border: `1px solid ${checkInEnabled ? "var(--color-primary)" : "var(--color-border-soft)"}`,
						}}
					>
						<Settings2 size={12} />
						{t("practice.check_in")}
					</button>
				)}
			</div>

			{/* Recovery banner */}
			{showRecovery && persistence.recovered && phase === "type" && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mx-4 mb-3 rounded-xl p-4 flex items-center gap-3"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
					}}
				>
					<div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
						<RotateCcw size={16} className="text-amber-700" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-semibold text-amber-900">
							{t("practice.recovery_title")}
						</p>
						<p className="text-xs text-amber-700">
							{t("practice.recovery_subtitle")}
						</p>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => {
								persistence.dismissRecovery();
								setShowRecovery(false);
							}}
							className="text-xs font-medium text-amber-700 px-2 py-1"
						>
							{t("practice.dismiss")}
						</button>
						<button
							type="button"
							onClick={handleRecoverSession}
							className="text-xs font-semibold text-white bg-amber-600 px-3 py-1 rounded-lg"
						>
							{t("practice.resume")}
						</button>
					</div>
				</motion.div>
			)}

			{/* Error banner */}
			{error && (
				<div
					className="mx-4 mb-3 rounded-xl p-3 text-sm"
					style={{
						backgroundColor: "var(--color-error-bg)",
						color: "var(--color-error-text)",
					}}
				>
					{error}
					<button
						type="button"
						onClick={() => setError(null)}
						className="ml-2 font-semibold"
					>
						✕
					</button>
				</div>
			)}

			{/* Main content */}
			<div className="flex-1 px-4 pb-28 overflow-y-auto">
				<AnimatePresence mode="wait">
					{phase === "type" && (
						<motion.div
							key="type"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<PracticeTypeSelector onSelect={handleSelectType} />
						</motion.div>
					)}

					{phase === "build" && (
						<motion.div
							key="build"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-4"
						>
							{isTutorUser && (
								<div
									className="rounded-2xl p-4 border"
									style={{
										backgroundColor: "var(--color-surface-card)",
										borderColor: "var(--color-border-soft)",
									}}
								>
									<div className="flex items-start gap-3">
										<div
											className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
											style={{
												backgroundColor: "var(--color-primary-light, #EEF2FF)",
												color: "var(--color-primary)",
											}}
										>
											<Leaf size={18} />
										</div>
										<div className="flex-1 min-w-0">
											<p
												className="text-sm font-semibold"
												style={{ color: "var(--color-text-primary)" }}
											>
												{t("practice.tutor_support_title")}
											</p>
											<p
												className="text-xs mt-0.5"
												style={{ color: "var(--color-text-secondary)" }}
											>
												{t("practice.tutor_support_subtitle")}
											</p>
										</div>
									</div>
									<div className="flex flex-wrap gap-2 mt-4">
										<button
											type="button"
											onClick={() => {
												setHasManualPresetChoice(true);
												setRecommendationApplied(false);
												applyPracticePreset(PRACTICE_PRESETS.ADULT);
											}}
											className="px-3 py-2 rounded-xl text-xs font-semibold transition"
											style={{
												backgroundColor:
													practicePreset === PRACTICE_PRESETS.ADULT
														? "var(--color-primary)"
														: "var(--color-surface)",
												color:
													practicePreset === PRACTICE_PRESETS.ADULT
														? "white"
														: "var(--color-text-secondary)",
												border: `1px solid ${
													practicePreset === PRACTICE_PRESETS.ADULT
														? "var(--color-primary)"
														: "var(--color-border-soft)"
												}`,
											}}
										>
											{t("practice.preset_adult")}
										</button>
										{isTutorUser && (
											<button
												type="button"
												onClick={() => {
													setHasManualPresetChoice(true);
													setRecommendationApplied(false);
													applyPracticePreset(PRACTICE_PRESETS.TUTOR);
												}}
												className="px-3 py-2 rounded-xl text-xs font-semibold transition"
												style={{
													backgroundColor:
														practicePreset === PRACTICE_PRESETS.TUTOR
															? "var(--color-primary)"
															: "var(--color-surface)",
													color:
														practicePreset === PRACTICE_PRESETS.TUTOR
															? "white"
															: "var(--color-text-secondary)",
													border: `1px solid ${
														practicePreset === PRACTICE_PRESETS.TUTOR
															? "var(--color-primary)"
															: "var(--color-border-soft)"
													}`,
												}}
											>
												{t("practice.preset_tutor")}
											</button>
										)}
										<button
											type="button"
											onClick={() => setLowStimMode((value) => !value)}
											className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition"
											style={{
												backgroundColor: lowStimMode
													? "var(--color-primary)"
													: "var(--color-surface)",
												color: lowStimMode
													? "white"
													: "var(--color-text-secondary)",
												border: `1px solid ${lowStimMode ? "var(--color-primary)" : "var(--color-border-soft)"}`,
											}}
											aria-pressed={lowStimMode}
										>
											<Leaf size={12} />
											{t("practice.low_stim_mode")}
										</button>
										<p
											className="text-[11px] leading-tight self-center"
											style={{ color: "var(--color-text-muted)" }}
										>
											{practicePreset === PRACTICE_PRESETS.TUTOR
												? t("practice.preset_tutor_hint")
												: t("practice.low_stim_mode_hint")}
										</p>
										{isTutorUser && recommendedPreset && (
											<div
												className="w-full mt-1 rounded-xl p-3 border flex items-center gap-3"
												style={{
													backgroundColor: "var(--color-surface)",
													borderColor: "var(--color-border-soft)",
												}}
											>
												<div className="flex-1 min-w-0">
													<p
														className="text-[11px] font-semibold"
														style={{ color: "var(--color-text-primary)" }}
													>
														{t("practice.reco_title")}:{" "}
														{recommendedPreset === PRACTICE_PRESETS.TUTOR
															? t("practice.reco_tutor")
															: t("practice.reco_adult")}
													</p>
													<p
														className="text-[11px]"
														style={{ color: "var(--color-text-muted)" }}
													>
														{t(recommendationReasonKey)}
													</p>
													{recommendationApplied && (
														<p
															className="text-[10px] mt-1"
															style={{ color: "var(--color-primary)" }}
														>
															{t("practice.reco_applied")}
														</p>
													)}
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setHasManualPresetChoice(true);
														setRecommendationApplied(true);
														applyPracticePreset(recommendedPreset);
													}}
												>
													{t("practice.reco_apply")}
												</Button>
											</div>
										)}
									</div>
								</div>
							)}
							<SessionBuilder
								practiceType={practiceType}
								initialBlocks={
									practiceType === "vk_sequence" ? initialBuilderBlocks : []
								}
								onStartSession={handleStartSession}
								onBack={() => setPhase("type")}
							/>
						</motion.div>
					)}

					{phase === "checkin" && (
						<motion.div
							key="checkin"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-5 pt-4"
						>
							<h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
								{isTutorPractice
									? t("practice.checkin_title_tutor")
									: t("practice.checkin_title")}
							</h2>

							<div
								className="rounded-2xl p-5"
								style={{ backgroundColor: "var(--color-surface-card)" }}
							>
								<p
									className="text-sm font-medium mb-3"
									style={{ color: "var(--color-text-primary)" }}
								>
									{isTutorPractice
										? t("practice.checkin_signal")
										: t("practice.checkin_mood")}
								</p>
								{isTutorPractice ? (
									<div className="grid grid-cols-3 gap-2">
										{["green", "yellow", "red"].map((signal) => {
											const selected = tutorSignal === signal;
											const signalColor =
												signal === "green"
													? "var(--color-signal-green)"
													: signal === "yellow"
														? "var(--color-signal-yellow)"
														: "var(--color-signal-red)";
											return (
												<button
													type="button"
													key={signal}
													onClick={() => handleTutorSignalChange(signal)}
													className="rounded-xl px-3 py-2 text-xs font-semibold transition"
													style={{
														backgroundColor: selected
															? signalColor
															: "var(--color-surface)",
														color: selected
															? "white"
															: "var(--color-text-secondary)",
														border: `1px solid ${selected ? signalColor : "var(--color-border-soft)"}`,
													}}
												>
													{t(`practice.signal_${signal}`)}
												</button>
											);
										})}
									</div>
								) : (
									<div className="flex flex-wrap gap-2">
										{GARDEN_MOOD_ORDER.map((m) => {
											const selected = checkInMood.includes(m);
											const color = getMoodColor(m);
											return (
												<button
													type="button"
													key={m}
													onClick={() => toggleCheckInMood(m)}
													className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition"
													style={{
														backgroundColor: selected
															? color
															: "var(--color-surface)",
														color: selected
															? "white"
															: "var(--color-text-secondary)",
													}}
												>
													{t(`session.moods.${m}`)}
												</button>
											);
										})}
									</div>
								)}
							</div>

							{!isTutorPractice && (
								<div
									className="rounded-2xl p-5"
									style={{ backgroundColor: "var(--color-surface-card)" }}
								>
									<p
										className="text-sm font-medium mb-3"
										style={{ color: "var(--color-text-primary)" }}
									>
										{t("practice.checkin_energy", { n: checkInEnergy })}
									</p>
									<input
										type="range"
										min={1}
										max={10}
										value={checkInEnergy}
										onChange={(e) => setCheckInEnergy(+e.target.value)}
										className="w-full"
										style={{ accentColor: "var(--color-primary)" }}
									/>
								</div>
							)}

							{!isTutorPractice && (
								<div
									className="rounded-2xl p-5"
									style={{ backgroundColor: "var(--color-surface-card)" }}
								>
									<p
										className="text-sm font-medium mb-3"
										style={{ color: "var(--color-text-primary)" }}
									>
										{t("practice.checkin_intention")}
									</p>
									<input
										type="text"
										value={checkInIntention}
										onChange={(e) => setCheckInIntention(e.target.value)}
										placeholder={t("practice.checkin_intention_placeholder")}
										maxLength={200}
										className="w-full text-sm rounded-xl p-3 outline-none focus:ring-1 border"
										style={{
											backgroundColor: "var(--color-surface)",
											color: "var(--color-text-primary)",
											borderColor: "var(--color-border-soft)",
										}}
									/>
								</div>
							)}

							<Button
								onClick={handleCheckInComplete}
								size="lg"
								className="w-full"
							>
								{t("practice.begin_practice")}
							</Button>
						</motion.div>
					)}

					{phase === "practice" && (
						<motion.div
							key="practice"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<GuidedPracticePlayer
								blocks={blocks}
								sequencesData={sequencesData}
								patternsData={patternsData}
								lowStimMode={lowStimMode}
								isTutorMode={isTutorPractice}
								safetyAnchors={user?.preferences?.safetyAnchors}
								onComplete={handleComplete}
								onAbandon={handleAbandon}
								onSaveProgress={handleSaveProgress}
							/>
						</motion.div>
					)}

					{phase === "journal" && (
						<motion.div
							key="journal"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
						>
							<PostPracticeJournal
								sessionSummary={sessionSummary}
								isTutorMode={isTutorPractice}
								checkInData={
									checkInEnabled
										? {
												mood: checkInMood,
												energyLevel: checkInEnergy,
												signal: isTutorPractice ? tutorSignal : null,
												intention: checkInIntention,
											}
										: null
								}
								onSave={handleSaveJournal}
								saving={saving}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

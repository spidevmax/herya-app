import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
	CheckCircle,
	ClipboardList,
	Clock,
	ChevronLeft,
	ChevronRight,
	Hourglass,
	PersonStanding,
	Wind,
	Leaf,
	Star,
} from "lucide-react";
import { createSession } from "@/api/sessions.api";
import { getBreathingPatterns } from "@/api/breathing.api";
import { getSequences } from "@/api/sequences.api";
import { getSequenceById } from "@/api/sequences.api";
import { getPosesByFamily, getPoses } from "@/api/poses.api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import CycleBreathingPlayer from "@/components/session/CycleBreathingPlayer";
import PostPracticeNudge from "@/components/session/PostPracticeNudge";
import { Button, StickyHeader } from "@/components/ui";
import { SESSION_TYPES } from "@/utils/constants";

const MOOD_OPTIONS = [
	"energized",
	"calm",
	"focused",
	"tired",
	"stiff",
	"peaceful",
	"grateful",
	"anxious",
];

const MEDITATION_OPTIONS = [
	{
		value: "guided",
		labelKey: "session.meditation_types.guided",
		fallback: "Guided",
	},
	{
		value: "silent",
		labelKey: "session.meditation_types.silent",
		fallback: "Silent",
	},
	{
		value: "breath_awareness",
		labelKey: "session.meditation_types.breath_awareness",
		fallback: "Breath awareness",
	},
	{
		value: "mantra",
		labelKey: "session.meditation_types.mantra",
		fallback: "Mantra",
	},
	{
		value: "visualization",
		labelKey: "session.meditation_types.visualization",
		fallback: "Visualization",
	},
];

const normalizeFamilyKey = (family) => {
	if (!family) return "";
	const raw = String(family).trim().toLowerCase();
	const normalized = raw.replace(/\s+/g, "_").replace(/-/g, "_");
	const aliases = {
		bow: "bow_sequence",
		triangle: "triangle_sequence",
		sun: "sun_salutation",
		vajrasana: "vajrasana_variations",
		lotus: "lotus_variations",
	};
	return aliases[normalized] || normalized;
};

const normalizePoseEntries = (sequence, familyPoses) => {
	const embedded = sequence?.structure?.corePoses
		?.map((entry) => entry?.pose || entry)
		?.filter(Boolean)
		?.filter((pose) => {
			if (typeof pose === "string") return pose.trim().length > 0;
			return Boolean(
				pose?._id || pose?.englishName || pose?.name || pose?.romanizationName,
			);
		});

	if (embedded?.length) return embedded;

	const keyPoses = (sequence?.keyPoses || []).filter(Boolean);
	if (keyPoses.length) return keyPoses;

	return familyPoses || [];
};

const getPreferredSessionDuration = (user) => {
	const raw = Number(user?.preferences?.sessionDuration);
	if (!Number.isFinite(raw)) return 20;
	if (raw < 5) return 5;
	if (raw > 180) return 180;
	return Math.round(raw);
};

const getPreferredBreathingEffect = (timeOfDay) => {
	const map = {
		morning: "energizing",
		afternoon: "balancing",
		evening: "calming",
		anytime: "balancing",
	};
	return map[timeOfDay] || "balancing";
};

export default function Session() {
	const { type } = useParams();
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const { user, refreshUser } = useAuth();
	const { t } = useLanguage();
	const tr = (key, fallback, vars) => {
		const value = t(key, vars);
		return value === key ? fallback : value;
	};
	const seqId = params.get("seq");

	const [step, setStep] = useState("pre"); // pre | active | post | done
	const [duration, setDuration] = useState(() =>
		getPreferredSessionDuration(user),
	);
	const [hasTouchedDuration, setHasTouchedDuration] = useState(false);
	const [moodBefore, setMoodBefore] = useState([]);
	const [moodAfter, setMoodAfter] = useState([]);
	const [energyBefore, setEnergyBefore] = useState(5);
	const [energyAfter, setEnergyAfter] = useState(5);
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [sequence, setSequence] = useState(null);
	const [sequenceLoading, setSequenceLoading] = useState(false);
	const [familyPoses, setFamilyPoses] = useState([]);
	const [familyPosesLoading, setFamilyPosesLoading] = useState(false);
	const [completeSequences, setCompleteSequences] = useState([]);
	const [completeBreathing, setCompleteBreathing] = useState([]);
	const [completeCatalogLoading, setCompleteCatalogLoading] = useState(false);
	const [completeWarmupId, setCompleteWarmupId] = useState("");
	const [completeMainIds, setCompleteMainIds] = useState([]);
	const [completeCooldownId, setCompleteCooldownId] = useState("");
	const [completePranayamaId, setCompletePranayamaId] = useState("");
	const [completeMeditationType, setCompleteMeditationType] = useState(
		MEDITATION_OPTIONS[0].value,
	);
	const [completeMeditationDuration, setCompleteMeditationDuration] =
		useState(10);
	const [currentPoseIndex, setCurrentPoseIndex] = useState(0);

	const sessionType = SESSION_TYPES.find((s) => s.value === type) || {
		label: tr("session.practice_fallback_label", "Practice"),
		icon: null,
		color: "var(--color-primary)",
	};
	const SESSION_TYPE_ICON_MAP = {
		vk_sequence: PersonStanding,
		pranayama: Wind,
		meditation: Leaf,
		complete_practice: Star,
	};
	const SessionTypeIcon = SESSION_TYPE_ICON_MAP[type] || PersonStanding;
	const sessionTypeLabelByType = {
		vk_sequence: tr("fab.vk_sequence", "VK Sequence"),
		pranayama: tr("fab.pranayama", "Pranayama"),
		meditation: tr("fab.meditation", "Meditation"),
		complete_practice: tr("fab.complete_practice", "Complete Practice"),
	};
	const sessionTypeLabel = sessionTypeLabelByType[type] || sessionType.label;
	const isPranayama = type === "pranayama";
	const isCompletePractice = type === "complete_practice";

	useEffect(() => {
		if (hasTouchedDuration) return;
		setDuration(getPreferredSessionDuration(user));
	}, [user, hasTouchedDuration]);

	useEffect(() => {
		if (seqId && !sequence && !sequenceLoading) {
			setSequenceLoading(true);
			getSequenceById(seqId)
				.then((r) => {
					const seq = r.data?.data || r.data;
					setSequence(seq);
				})
				.catch((err) => {
					console.error("Error loading sequence:", err);
					setSequence(null);
				})
				.finally(() => setSequenceLoading(false));
		}
	}, [seqId, sequence, sequenceLoading]);

	const practicePoses = normalizePoseEntries(sequence, familyPoses);

	useEffect(() => {
		if (!sequence?.family) return;

		const hasUsableEmbeddedPoses =
			normalizePoseEntries(sequence, []).length > 0;

		if (hasUsableEmbeddedPoses || familyPoses.length > 0 || familyPosesLoading)
			return;

		const family = normalizeFamilyKey(sequence.family);
		if (!family) return;

		setFamilyPosesLoading(true);
		getPosesByFamily(family)
			.then((r) => {
				const payload = r.data?.data || r.data || {};
				const grouped = Array.isArray(payload)
					? payload
					: Object.values(payload).flat().filter(Boolean);
				if (Array.isArray(grouped) && grouped.length > 0) {
					setFamilyPoses(grouped);
					return;
				}

				return getPoses({ vkFamily: family, limit: 100 }).then((fallback) => {
					const poses =
						fallback.data?.data?.poses || fallback.data?.poses || [];
					setFamilyPoses(Array.isArray(poses) ? poses : []);
				});
			})
			.catch(() => setFamilyPoses([]))
			.finally(() => setFamilyPosesLoading(false));
	}, [sequence, familyPoses.length, familyPosesLoading]);

	useEffect(() => {
		if (
			(!isCompletePractice && !isPranayama) ||
			completeCatalogLoading ||
			completeSequences.length > 0
		) {
			return;
		}

		setCompleteCatalogLoading(true);
		Promise.all([
			getSequences({ limit: 100 }),
			getBreathingPatterns({ limit: 100 }),
		])
			.then(([seqRes, breathRes]) => {
				const seqPayload = seqRes.data?.data || seqRes.data || {};
				const breathPayload = breathRes.data?.data || breathRes.data || {};
				const seqList =
					seqPayload.sequences ?? (Array.isArray(seqPayload) ? seqPayload : []);
				const breathList =
					breathPayload.patterns ??
					(Array.isArray(breathPayload) ? breathPayload : []);

				setCompleteSequences(Array.isArray(seqList) ? seqList : []);
				const safeBreathList = Array.isArray(breathList) ? breathList : [];
				setCompleteBreathing(safeBreathList);

				if (!completePranayamaId && safeBreathList.length > 0) {
					const preferredEffect = getPreferredBreathingEffect(
						user?.preferences?.timeOfDay,
					);
					const withRetentions = safeBreathList.find((item) => {
						const ratio = item?.patternRatio || {};
						return (ratio.hold || 0) > 0 || (ratio.holdAfterExhale || 0) > 0;
					});
					const recommended =
						(isPranayama && withRetentions) ||
						safeBreathList.find(
							(item) => item?.energyEffect === preferredEffect,
						) ||
						safeBreathList[0];
					if (recommended?._id) setCompletePranayamaId(recommended._id);
				}
			})
			.catch(() => {
				setCompleteSequences([]);
				setCompleteBreathing([]);
			})
			.finally(() => setCompleteCatalogLoading(false));
	}, [
		isCompletePractice,
		isPranayama,
		completeCatalogLoading,
		completeSequences.length,
		completePranayamaId,
		user,
	]);

	const findSequenceById = (id) =>
		completeSequences.find((item) => item._id === id);
	const findBreathingById = (id) =>
		completeBreathing.find((item) => item._id === id);
	const toggleMainSequence = (id) => {
		setCompleteMainIds((prev) =>
			prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
		);
	};
	const completeSelectedWarmup = findSequenceById(completeWarmupId);
	const completeSelectedCooldown = findSequenceById(completeCooldownId);
	const completeSelectedMain = completeMainIds
		.map(findSequenceById)
		.filter(Boolean);
	const completeSelectedPranayama = findBreathingById(completePranayamaId);
	const completeSelectedMeditation =
		MEDITATION_OPTIONS.find(
			(option) => option.value === completeMeditationType,
		) || MEDITATION_OPTIONS[0];
	const getMeditationLabel = (option) => tr(option.labelKey, option.fallback);

	const toggleMood = (setList, mood) => {
		setList((prev) =>
			prev.includes(mood)
				? prev.filter((m) => m !== mood)
				: prev.length < 3
					? [...prev, mood]
					: prev,
		);
	};

	const handleComplete = async () => {
		setSaving(true);
		try {
			const completePractice = isCompletePractice
				? {
						...(completeWarmupId ? { warmup: completeWarmupId } : {}),
						mainSequences: completeMainIds,
						...(completeCooldownId ? { cooldown: completeCooldownId } : {}),
						...(completePranayamaId ? { pranayama: completePranayamaId } : {}),
						meditation: {
							duration: completeMeditationDuration,
							meditationType: completeMeditationType,
						},
					}
				: undefined;

			const payload = {
				sessionType: type,
				duration,
				completed: true,
				moodBefore,
				moodAfter,
				energyLevel: { before: energyBefore, after: energyAfter },
				notes,
				...(isCompletePractice
					? { completePractice }
					: seqId
						? { vkSequence: seqId }
						: {}),
			};
			await createSession(payload);
			await refreshUser();
			setStep("done");
		} catch (err) {
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	const currentPose = practicePoses[currentPoseIndex];
	const currentPoseName =
		(typeof currentPose === "string" ? currentPose : null) ||
		currentPose?.englishName ||
		currentPose?.name ||
		currentPose?.romanizationName ||
		tr("session.pose_fallback", "Pose");
	const currentPoseSanskrit =
		typeof currentPose === "object"
			? currentPose?.sanskritName || currentPose?.romanizedName
			: null;
	const currentPoseDescription =
		typeof currentPose === "object" ? currentPose?.description : null;
	const canStartPractice = !isCompletePractice || completeMainIds.length > 0;

	if (step === "done") {
		return (
			<main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6">
				<motion.div
					aria-hidden="true"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
				>
					<CheckCircle size={72} style={{ color: "var(--color-primary)" }} />
				</motion.div>
				<h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
					{t("session.done_title")}
				</h1>
				<p className="text-[var(--color-text-muted)] text-center text-sm font-medium">
					{t("session.done_subtitle")}
				</p>
				<Button onClick={() => navigate("/")}>{t("session.back_home")}</Button>
			</main>
		);
	}

	return (
		<main className="flex flex-col min-h-dvh">
			<StickyHeader onBack={() => navigate(-1)} title={sessionTypeLabel} />

			<div className="flex-1 px-4 pb-28 overflow-y-auto">
				<AnimatePresence mode="wait">
					{step === "pre" && (
						<motion.section
							key="pre"
							aria-labelledby="session-pre-heading"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-6 pt-4"
						>
							<h2 id="session-pre-heading" className="text-xl font-semibold text-[var(--color-text-primary)]">
								{t("session.pre_title")}
							</h2>
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{t("session.pre_mood")}
								</p>
								<div className="flex flex-wrap gap-2">
									{MOOD_OPTIONS.map((m) => (
										<button
											type="button"
											key={m}
											onClick={() => toggleMood(setMoodBefore, m)}
											className={
												"px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition " +
												(moodBefore.includes(m)
													? "bg-[var(--color-primary)] text-white"
													: "bg-[var(--color-surface)] text-[var(--color-text-muted)]")
											}
										>
											{t(`session.moods.${m}`)}
										</button>
									))}
								</div>
							</div>
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{t("session.pre_energy", { n: energyBefore })}
								</p>
								<input
									type="range"
									min={1}
									max={10}
									value={energyBefore}
									onChange={(e) => setEnergyBefore(+e.target.value)}
									className="w-full accent-[var(--color-primary)]"
								/>
							</div>
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2"
			
								>
									<Clock size={16} />{" "}
									{t("session.pre_duration", { n: duration })}
								</p>
								<div className="flex gap-2 flex-wrap">
									{[15, 20, 30, 45, 60, 90].map((d) => (
										<button
											type="button"
											key={d}
											onClick={() => {
												setHasTouchedDuration(true);
												setDuration(d);
											}}
											className={
												"px-4 py-2 rounded-xl text-sm font-semibold transition " +
												(duration === d
													? "bg-[var(--color-primary)] text-white"
													: "bg-[var(--color-surface)] text-[var(--color-text-muted)]")
											}
										>
											{d}m
										</button>
									))}
								</div>
							</div>
							<Button
								onClick={() => setStep("active")}
								disabled={!canStartPractice}
							>
								{t("session.begin")}
							</Button>
						</motion.section>
					)}

					{step === "active" && (
						<motion.section
							key="active"
							aria-label={sessionTypeLabel}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-6 pt-4 items-center"
						>
							{isPranayama ? (
								completeSelectedPranayama ? (
									<div className="w-full">
										<CycleBreathingPlayer
											pattern={completeSelectedPranayama}
											config={{
												cycles:
													completeSelectedPranayama.recommendedPractice?.cycles
														?.default,
												pauseBetweenCycles: 0,
												hapticFeedback: true,
											}}
											onComplete={() => setStep("post")}
										/>
									</div>
								) : (
									<div className="w-full text-center py-16">
										<p className="text-[var(--color-text-muted)] text-sm font-medium">
											{tr(
												"session.complete_loading_catalog",
												"Loading sequences and pranayama...",
											)}
										</p>
									</div>
								)
							) : isCompletePractice ? (
								<div className="w-full flex flex-col gap-4">
									<div className="rounded-2xl bg-[var(--color-surface-card)] p-5 text-center">
										<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
											{t("fab.complete_practice")}
										</p>
										<h3
											className="text-xl font-semibold text-[var(--color-text-primary)] mb-2"
					
										>
											{completeSelectedMain.length > 0
												? tr(
														"session.complete_ready_title",
														"Your practice plan is ready",
													)
												: tr(
														"session.complete_choose_main_title",
														"Choose at least one main sequence",
													)}
										</h3>
										<p className="text-sm text-[var(--color-text-muted)]">
											{completeSelectedMain.length > 0
												? tr(
														"session.complete_ready_hint",
														"Follow the structure you built: warmup, main sequences, pranayama, and meditation.",
													)
												: tr(
														"session.complete_choose_main_hint",
														"Go back and select the main sequence(s) you want to practice.",
													)}
										</p>
									</div>

									{completeSelectedWarmup && (
										<div className="rounded-2xl bg-[var(--color-surface-card)] p-4">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
												{tr("session.complete_warmup", "Warmup")}
											</p>
											<p className="text-sm font-medium text-[var(--color-text-primary)]">
												{completeSelectedWarmup.englishName}
											</p>
										</div>
									)}

									{completeSelectedMain.length > 0 && (
										<div className="rounded-2xl bg-[var(--color-surface-card)] p-4">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
												{tr(
													"session.complete_main_sequences",
													"Main sequences",
												)}
											</p>
											<div className="flex flex-wrap gap-2">
												{completeSelectedMain.map((item) => (
													<span
														key={item._id}
														className="px-3 py-1.5 rounded-xl bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border)]"
													>
														{item.englishName}
													</span>
												))}
											</div>
										</div>
									)}

									{completeSelectedCooldown && (
										<div className="rounded-2xl bg-[var(--color-surface-card)] p-4">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
												{tr("session.complete_cooldown", "Cooldown")}
											</p>
											<p className="text-sm font-medium text-[var(--color-text-primary)]">
												{completeSelectedCooldown.englishName}
											</p>
										</div>
									)}

									{completeSelectedPranayama && (
										<div className="rounded-2xl bg-[var(--color-surface-card)] p-4">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
												{t("fab.pranayama")}
											</p>
											<p className="text-sm font-medium text-[var(--color-text-primary)]">
												{completeSelectedPranayama.romanizationName}
											</p>
										</div>
									)}

									<div className="rounded-2xl bg-[var(--color-surface-card)] p-4">
										<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
											{t("fab.meditation")}
										</p>
										<p className="text-sm font-medium text-[var(--color-text-primary)]">
											{getMeditationLabel(completeSelectedMeditation)} ·{" "}
											{completeMeditationDuration} min
										</p>
									</div>
								</div>
							) : seqId && (sequenceLoading || familyPosesLoading) ? (
								<div className="w-full text-center py-16">
									<div className="mb-4 flex justify-center">
										<Hourglass
											size={56}
											style={{ color: "var(--color-primary)" }}
										/>
									</div>
									<p
										className="text-xl font-semibold text-[var(--color-text-primary)]"
				
									>
										{tr("session.loading_sequence", "Loading sequence...")}
									</p>
								</div>
							) : seqId && sequence && practicePoses.length > 0 ? (
								<>
									<div className="w-full">
										<p
											className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-widest text-center mb-3"
					
										>
											{tr(
												"session.pose_progress",
												"Pose {current} of {total}",
												{
													current: currentPoseIndex + 1,
													total: practicePoses.length,
												},
											)}
										</p>
										<motion.div
											key={`pose-${currentPoseIndex}`}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3 }}
											className="bg-[var(--color-surface-card)] rounded-2xl p-6 text-center"
										>
											<div className="text-6xl mb-4">
												<PersonStanding
													size={56}
													style={{ color: "var(--color-primary)" }}
												/>
											</div>
											<h3
												className="text-xl font-semibold text-[var(--color-text-primary)] mb-2"
						
											>
												{currentPoseName}
											</h3>
											{currentPoseSanskrit && (
												<p
													className="text-sm italic text-[var(--color-text-muted)] mb-4"
							
												>
													{currentPoseSanskrit}
												</p>
											)}
											{currentPoseDescription && (
												<p
													className="text-sm text-[var(--color-text-muted)] mt-4"
							
												>
													{currentPoseDescription}
												</p>
											)}
										</motion.div>

										<div className="flex justify-between items-center mt-6 gap-2">
											<button
												type="button"
												onClick={() =>
													setCurrentPoseIndex(Math.max(0, currentPoseIndex - 1))
												}
												disabled={currentPoseIndex === 0}
												className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center disabled:opacity-30"
											>
												<ChevronLeft size={20} />
											</button>
											<div className="flex-1 flex justify-center gap-1">
												{practicePoses.map((pose, idx) => (
													<button
														key={`pose-dot-${typeof pose === "string" ? pose : pose._id || pose.id || pose.englishName || pose.name}`}
														type="button"
														onClick={() => setCurrentPoseIndex(idx)}
														className={
															"w-2 h-2 rounded-full transition " +
															(idx === currentPoseIndex
																? "bg-[var(--color-primary)] w-6"
																: "bg-[var(--color-border)]")
														}
													/>
												))}
											</div>
											<button
												type="button"
												onClick={() =>
													setCurrentPoseIndex(
														Math.min(
															practicePoses.length - 1,
															currentPoseIndex + 1,
														),
													)
												}
												disabled={currentPoseIndex === practicePoses.length - 1}
												className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center disabled:opacity-30"
											>
												<ChevronRight size={20} />
											</button>
										</div>
									</div>
								</>
							) : seqId && sequence && practicePoses.length === 0 ? (
								<div className="w-full text-center py-16">
									<div className="mb-4 flex justify-center">
										<ClipboardList
											size={56}
											style={{ color: "var(--color-primary)" }}
										/>
									</div>
									<p
										className="text-xl font-semibold text-[var(--color-text-primary)]"
				
									>
										{tr(
											"session.no_poses_in_sequence",
											"No poses found in this sequence",
										)}
									</p>
								</div>
							) : (
								<div className="text-center py-16">
									<div className="mb-4 flex justify-center">
										<SessionTypeIcon
											size={64}
											style={{ color: "var(--color-primary)" }}
										/>
									</div>
									<p
										className="text-xl font-semibold text-[var(--color-text-primary)]"
				
									>
										{t("session.active_title")}
									</p>
									<p
										className="text-[var(--color-text-muted)] text-sm font-medium mt-2"
				
									>
										{tr("session.active_minutes", "{n} minutes", {
											n: duration,
										})}
									</p>
								</div>
							)}
							<Button onClick={() => setStep("post")} className="w-full">
								{t("session.finish")}
							</Button>
						</motion.section>
					)}

					{isCompletePractice && (
						<div className="bg-[var(--color-surface-card)] rounded-2xl p-5 flex flex-col gap-4">
							<div>
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{tr(
										"session.complete_builder_title",
										"Build your complete practice",
									)}
								</p>
								{completeCatalogLoading ? (
									<p className="text-sm text-[var(--color-text-muted)]">
										{tr(
											"session.complete_loading_catalog",
											"Loading sequences and pranayama...",
										)}
									</p>
								) : (
									<div className="flex flex-col gap-4">
										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
												{tr(
													"session.complete_warmup_sequence",
													"Warmup sequence",
												)}
											</p>
											<select
												value={completeWarmupId}
												onChange={(e) => setCompleteWarmupId(e.target.value)}
												className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
											>
												<option value="">
													{tr(
														"session.complete_select_warmup",
														"Select warmup",
													)}
												</option>
												{completeSequences.map((item) => (
													<option key={item._id} value={item._id}>
														{item.englishName} · {tr("session.level", "Level")}{" "}
														{item.level}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
												{tr(
													"session.complete_main_sequences",
													"Main sequences",
												)}
											</p>
											<div className="max-h-44 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex flex-col gap-2">
												{completeSequences.map((item) => (
													<button
														type="button"
														key={item._id}
														onClick={() => toggleMainSequence(item._id)}
														className={
															"w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition " +
															(completeMainIds.includes(item._id)
																? "bg-[var(--color-primary)] text-white"
																: "bg-[var(--color-surface-card)] text-[var(--color-text-primary)]")
														}
													>
														{item.englishName} · {item.family}
													</button>
												))}
											</div>
										</div>

										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
												{tr(
													"session.complete_cooldown_sequence",
													"Cooldown sequence",
												)}
											</p>
											<select
												value={completeCooldownId}
												onChange={(e) => setCompleteCooldownId(e.target.value)}
												className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
											>
												<option value="">
													{tr(
														"session.complete_select_cooldown",
														"Select cooldown",
													)}
												</option>
												{completeSequences.map((item) => (
													<option key={item._id} value={item._id}>
														{item.englishName} · {tr("session.level", "Level")}{" "}
														{item.level}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
												{t("fab.pranayama")}
											</p>
											<select
												value={completePranayamaId}
												onChange={(e) => setCompletePranayamaId(e.target.value)}
												className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
											>
												<option value="">
													{tr("session.complete_no_pranayama", "No pranayama")}
												</option>
												{completeBreathing.map((item) => (
													<option key={item._id} value={item._id}>
														{item.romanizationName}
													</option>
												))}
											</select>
										</div>

										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
												{t("fab.meditation")}
											</p>
											<select
												value={completeMeditationType}
												onChange={(e) =>
													setCompleteMeditationType(e.target.value)
												}
												className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
											>
												{MEDITATION_OPTIONS.map((option) => (
													<option key={option.value} value={option.value}>
														{getMeditationLabel(option)}
													</option>
												))}
											</select>
											<div>
												<p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
													{tr(
														"session.complete_meditation_duration",
														"Meditation duration",
													)}
													: {completeMeditationDuration} min
												</p>
												<input
													type="range"
													min={5}
													max={30}
													step={5}
													value={completeMeditationDuration}
													onChange={(e) =>
														setCompleteMeditationDuration(+e.target.value)
													}
													className="w-full accent-[var(--color-secondary)]"
												/>
											</div>
										</div>
									</div>
								)}
							</div>

							{completeMainIds.length > 0 && (
								<div className="rounded-2xl bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-primary)]">
									<p className="font-semibold mb-2">
										{tr("session.complete_plan_title", "Your plan")}
									</p>
									<p>
										{tr("session.complete_warmup", "Warmup")}:{" "}
										{completeSelectedWarmup?.englishName ||
											tr("session.none", "None")}
									</p>
									<p>
										{tr("session.complete_main", "Main")}:{" "}
										{completeSelectedMain
											.map((item) => item.englishName)
											.join(" · ")}
									</p>
									<p>
										{tr("session.complete_cooldown", "Cooldown")}:{" "}
										{completeSelectedCooldown?.englishName ||
											tr("session.none", "None")}
									</p>
									<p>
										{t("fab.pranayama")}:{" "}
										{completeSelectedPranayama?.romanizationName ||
											tr("session.none", "None")}
									</p>
									<p>
										{t("fab.meditation")}:{" "}
										{getMeditationLabel(completeSelectedMeditation)} ·{" "}
										{completeMeditationDuration} min
									</p>
								</div>
							)}
						</div>
					)}
					{step === "post" && (
						<motion.section
							key="post"
							aria-labelledby="session-post-heading"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="flex flex-col gap-6 pt-4"
						>
							<h2
								id="session-post-heading"
								className="text-xl font-semibold text-[var(--color-text-primary)]"
							>
								{t("session.post_title")}
							</h2>
							<PostPracticeNudge durationMinutes={duration} />
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{t("session.post_mood")}
								</p>
								<div className="flex flex-wrap gap-2">
									{MOOD_OPTIONS.map((m) => (
										<button
											type="button"
											key={m}
											onClick={() => toggleMood(setMoodAfter, m)}
											className={
												"px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition " +
												(moodAfter.includes(m)
													? "bg-[var(--color-secondary)] text-white"
													: "bg-[var(--color-surface)] text-[var(--color-text-muted)]")
											}
										>
											{t(`session.moods.${m}`)}
										</button>
									))}
								</div>
							</div>
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{t("session.post_energy", { n: energyAfter })}
								</p>
								<input
									type="range"
									min={1}
									max={10}
									value={energyAfter}
									onChange={(e) => setEnergyAfter(+e.target.value)}
									className="w-full accent-[var(--color-secondary)]"
								/>
							</div>
							<div className="bg-[var(--color-surface-card)] rounded-2xl p-5">
								<p
									className="text-sm font-medium text-[var(--color-text-primary)] mb-3"
			
								>
									{t("session.post_notes")}
								</p>
								<textarea
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={3}
									placeholder={t("session.post_notes_placeholder")}
									className="w-full text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-secondary)] resize-none"
								/>
							</div>
							<Button onClick={handleComplete} disabled={saving}>
								{saving ? t("session.saving") : t("session.save")}
							</Button>
						</motion.section>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Check, Minus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import PostPracticeNudge from "./PostPracticeNudge";
import {
	MOOD_AFTER_OPTIONS,
	MOOD_OPTIONS,
	MOOD_COLORS,
} from "@/utils/constants";

const getMoodColor = (mood) => MOOD_COLORS[mood] || "var(--color-secondary)";
const TUTOR_SIGNAL_AFTER_MAP = {
	green: { mood: ["calm"], energy: 4, stress: 3 },
	yellow: { mood: ["focused"], energy: 5, stress: 5 },
	red: { mood: ["anxious"], energy: 6, stress: 8 },
};
const SIGNAL_SCORES = {
	green: 2,
	yellow: 1,
	red: 0,
};

const SENSATION_OPTIONS = [
	"relaxed",
	"energized",
	"light",
	"heavy",
	"open",
	"tight",
	"warm",
	"cool",
];
const VALID_MOOD_BEFORE = new Set(MOOD_OPTIONS);
const VALID_MOOD_AFTER = new Set(MOOD_AFTER_OPTIONS);

export default function PostPracticeJournal({
	sessionSummary,
	checkInData,
	isTutorMode = false,
	onSave,
	saving,
	error = null,
	onDismissError,
}) {
	const { t } = useLanguage();
	const [moodAfter, setMoodAfter] = useState([]);
	const [energyAfter, setEnergyAfter] = useState(5);
	const [stressAfter, setStressAfter] = useState(5);
	const [physicalSensations, setPhysicalSensations] = useState([]);
	const [emotionalNotes, setEmotionalNotes] = useState("");
	const [gratitude, setGratitude] = useState("");
	const [learnings, setLearnings] = useState("");
	const [signalAfter, setSignalAfter] = useState("yellow");

	const toggleMood = (mood) => {
		setMoodAfter((prev) =>
			prev.includes(mood)
				? prev.filter((m) => m !== mood)
				: prev.length < 3
					? [...prev, mood]
					: prev,
		);
	};

	const toggleSensation = (s) => {
		setPhysicalSensations((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
		);
	};

	const handleSave = () => {
		const tutorSignalPreset =
			TUTOR_SIGNAL_AFTER_MAP[signalAfter] || TUTOR_SIGNAL_AFTER_MAP.yellow;
		const normalizedMoodBeforeRaw =
			checkInData?.mood?.length > 0 ? checkInData.mood : ["focused"];
		const normalizedMoodBefore = normalizedMoodBeforeRaw.filter((m) =>
			VALID_MOOD_BEFORE.has(m),
		);
		const normalizedMoodAfterRaw = isTutorMode
			? tutorSignalPreset.mood
			: moodAfter.length > 0
				? moodAfter
				: ["calm"];
		const normalizedMoodAfter = normalizedMoodAfterRaw.filter((m) =>
			VALID_MOOD_AFTER.has(m),
		);
		const normalizedEnergyAfter = isTutorMode
			? tutorSignalPreset.energy
			: energyAfter;
		const normalizedStressAfter = isTutorMode
			? tutorSignalPreset.stress
			: stressAfter;

		onSave({
			moodAfter:
				normalizedMoodAfter.length > 0 ? normalizedMoodAfter : ["calm"],
			...(isTutorMode ? { signalAfter } : {}),
			energyLevel: {
				before: checkInData?.energyLevel || 5,
				after: normalizedEnergyAfter,
			},
			stressLevel: {
				before: checkInData?.stressLevel ?? 5,
				after: normalizedStressAfter,
			},
			physicalSensations: physicalSensations.join(", "),
			emotionalNotes,
			gratitude,
			insights: learnings,
			moodBefore:
				normalizedMoodBefore.length > 0 ? normalizedMoodBefore : ["focused"],
		});
	};

	const formatTime = (sec) => {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, "0")}`;
	};

	const tutorSummaryKey = (() => {
		if (!isTutorMode) return null;
		if (signalAfter === "green") return "practice.tutor_summary_green";
		if (signalAfter === "yellow") return "practice.tutor_summary_yellow";
		return "practice.tutor_summary_red";
	})();

	const tutorMicroAchievements = (() => {
		if (!isTutorMode) return [];

		const durationMinutes = Math.max(
			1,
			Math.round((sessionSummary?.globalElapsedSec || 0) / 60),
		);
		const blocksCompleted = Math.max(
			0,
			Number(sessionSummary?.blocksCompleted || 0),
		);
		const entries = [];

		if (blocksCompleted > 0) {
			entries.push(t("practice.micro_blocks", { n: blocksCompleted }));
		}

		entries.push(t("practice.micro_minutes", { n: durationMinutes }));

		const beforeSignal = checkInData?.signal;
		const beforeScore = SIGNAL_SCORES[beforeSignal];
		const afterScore = SIGNAL_SCORES[signalAfter];

		if (beforeScore !== undefined && afterScore !== undefined) {
			if (afterScore > beforeScore) {
				entries.push(t("practice.micro_regulation_up"));
			} else if (afterScore === beforeScore) {
				entries.push(t("practice.micro_regulation_steady"));
			} else {
				entries.push(t("practice.micro_regulation_awareness"));
			}
		}

		return entries.slice(0, 3);
	})();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col gap-5 pt-2"
		>
			<PostPracticeNudge
				durationMinutes={Math.round(
					(sessionSummary?.globalElapsedSec || 0) / 60,
				)}
				stressAfter={stressAfter}
			/>

			{/* Session summary */}
			<div
				className="rounded-2xl p-5 text-center"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
				>
					<CheckCircle
						size={48}
						style={{ color: "var(--color-primary)" }}
						className="mx-auto mb-3"
					/>
				</motion.div>
				<h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">
					{t("practice.journal_title")}
				</h2>
				{sessionSummary && (
					<div className="flex justify-center gap-4 mt-3">
						<div className="text-center">
							<p
								className="text-lg font-bold"
								style={{ color: "var(--color-primary)" }}
							>
								{formatTime(sessionSummary.globalElapsedSec || 0)}
							</p>
							<p
								className="text-[10px] uppercase tracking-wider"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("practice.duration")}
							</p>
						</div>
						<div className="text-center">
							<p
								className="text-lg font-bold"
								style={{ color: "var(--color-secondary)" }}
							>
								{sessionSummary.blocksCompleted || 0}
							</p>
							<p
								className="text-[10px] uppercase tracking-wider"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("practice.blocks_completed")}
							</p>
						</div>
					</div>
				)}
				{isTutorMode && tutorSummaryKey && (
					<p
						className="text-xs mt-3"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t(tutorSummaryKey)}
					</p>
				)}
				{isTutorMode && tutorMicroAchievements.length > 0 && (
					<div
						className="mt-4 rounded-xl px-3 py-2 text-left"
						style={{ backgroundColor: "var(--color-surface)" }}
					>
						<p
							className="text-[11px] font-semibold mb-1"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("practice.micro_title")}
						</p>
						<div className="flex flex-col gap-1">
							{tutorMicroAchievements.map((item) => (
								<p
									key={item}
									className="text-[11px]"
									style={{ color: "var(--color-text-secondary)" }}
								>
									• {item}
								</p>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Mood after */}
			<div
				className="rounded-2xl p-5"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<p
					className="text-sm font-medium mb-3"
					style={{ color: "var(--color-text-primary)" }}
				>
					{isTutorMode
						? t("practice.checkout_signal")
						: t("practice.journal_mood_after")}
				</p>
				{isTutorMode ? (
					<div className="grid grid-cols-3 gap-2">
						{["green", "yellow", "red"].map((signal) => {
							const selected = signalAfter === signal;
							const signalColor =
								signal === "green"
									? "var(--color-signal-green)"
									: signal === "yellow"
										? "var(--color-signal-yellow)"
										: "var(--color-signal-red)";
							const SignalIcon =
								signal === "green"
									? Check
									: signal === "yellow"
										? Minus
										: X;
							return (
								<button
									type="button"
									key={signal}
									aria-pressed={selected}
									onClick={() => setSignalAfter(signal)}
									className="rounded-xl px-3 py-2.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-[48px]"
									style={{
										backgroundColor: selected
											? signalColor
											: "var(--color-surface)",
										color: selected ? "white" : "var(--color-text-secondary)",
										border: `2px solid ${selected ? signalColor : "var(--color-border-soft)"}`,
									}}
									aria-label={t(`practice.signal_${signal}`)}
								>
									<SignalIcon size={16} strokeWidth={3} />
									{t(`practice.signal_${signal}`)}
								</button>
							);
						})}
					</div>
				) : (
					<div className="flex flex-wrap gap-2">
						{MOOD_AFTER_OPTIONS.map((m) => {
							const selected = moodAfter.includes(m);
							const color = getMoodColor(m);
							return (
								<button
									type="button"
									key={m}
									onClick={() => toggleMood(m)}
									className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition"
									style={{
										backgroundColor: selected ? color : "var(--color-surface)",
										color: selected ? "white" : "var(--color-text-secondary)",
									}}
								>
									{t(`session.moods.${m}`)}
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Energy & Stress */}
			{!isTutorMode && (
				<div
					className="rounded-2xl p-5 flex flex-col gap-4"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<div>
						<p
							className="text-sm font-medium mb-2"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("practice.journal_energy_after", { n: energyAfter })}
						</p>
						<input
							type="range"
							min={1}
							max={10}
							value={energyAfter}
							onChange={(e) => setEnergyAfter(+e.target.value)}
							className="w-full"
							style={{ accentColor: "var(--color-secondary)" }}
						/>
					</div>
					<div>
						<p
							className="text-sm font-medium mb-2"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("practice.journal_stress_after", { n: stressAfter })}
						</p>
						<input
							type="range"
							min={1}
							max={10}
							value={stressAfter}
							onChange={(e) => setStressAfter(+e.target.value)}
							className="w-full"
							style={{ accentColor: "var(--color-accent)" }}
						/>
					</div>
				</div>
			)}

			{/* Physical sensations */}
			{!isTutorMode && (
				<div
					className="rounded-2xl p-5"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<p
						className="text-sm font-medium mb-3"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("practice.journal_sensations")}
					</p>
					<div className="flex flex-wrap gap-2">
						{SENSATION_OPTIONS.map((s) => (
							<button
								type="button"
								key={s}
								onClick={() => toggleSensation(s)}
								className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition"
								style={{
									backgroundColor: physicalSensations.includes(s)
										? "var(--color-accent)"
										: "var(--color-surface)",
									color: physicalSensations.includes(s)
										? "white"
										: "var(--color-text-secondary)",
								}}
							>
								{t(`practice.sensation_${s}`)}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Free-form notes */}
			<div
				className="rounded-2xl p-5 flex flex-col gap-4"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<div>
					<p
						className="text-sm font-medium mb-2"
						style={{ color: "var(--color-text-primary)" }}
					>
						{isTutorMode
							? t("practice.tutor_notes")
							: t("practice.journal_emotional_notes")}
					</p>
					<textarea
						value={emotionalNotes}
						onChange={(e) => setEmotionalNotes(e.target.value)}
						rows={2}
						placeholder={t("practice.journal_emotional_placeholder")}
						className="w-full text-sm rounded-xl p-3 resize-none outline-none focus:ring-1"
						style={{
							backgroundColor: "var(--color-surface)",
							color: "var(--color-text-primary)",
							"--tw-ring-color": "var(--color-secondary)",
						}}
					/>
				</div>
				<div>
					<p
						className="text-sm font-medium mb-2"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("practice.journal_gratitude")}
					</p>
					<textarea
						value={gratitude}
						onChange={(e) => setGratitude(e.target.value)}
						rows={2}
						placeholder={t("practice.journal_gratitude_placeholder")}
						className="w-full text-sm rounded-xl p-3 resize-none outline-none focus:ring-1"
						style={{
							backgroundColor: "var(--color-surface)",
							color: "var(--color-text-primary)",
							"--tw-ring-color": "var(--color-secondary)",
						}}
					/>
				</div>
				<div>
					<p
						className="text-sm font-medium mb-2"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("practice.journal_learnings")}
					</p>
					<textarea
						value={learnings}
						onChange={(e) => setLearnings(e.target.value)}
						rows={2}
						placeholder={t("practice.journal_learnings_placeholder")}
						className="w-full text-sm rounded-xl p-3 resize-none outline-none focus:ring-1"
						style={{
							backgroundColor: "var(--color-surface)",
							color: "var(--color-text-primary)",
							"--tw-ring-color": "var(--color-secondary)",
						}}
					/>
				</div>
			</div>

			{/* Error banner */}
			{error && (
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="rounded-xl p-3 flex items-center justify-between"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
					}}
				>
					<p
						className="text-sm font-medium"
						style={{ color: "var(--color-text-primary)" }}
					>
						{error}
					</p>
					{onDismissError && (
						<button
							type="button"
							onClick={onDismissError}
							className="ml-2 text-xs font-bold"
							style={{ color: "var(--color-text-muted)" }}
						>
							✕
						</button>
					)}
				</motion.div>
			)}

			{/* Save */}
			<Button
				onClick={handleSave}
				disabled={saving}
				loading={saving}
				size="lg"
				className="w-full"
			>
				{error ? t("practice.retry_save") : t("practice.save_journal")}
			</Button>
		</motion.div>
	);
}

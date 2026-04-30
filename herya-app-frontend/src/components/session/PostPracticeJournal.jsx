import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Check, Minus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import JournalCard from "@/components/journal/JournalCard";
import SliderPanel from "@/components/journal/SliderPanel";
import SensationChips from "@/components/journal/SensationChips";
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
			physicalSensations,
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
		<motion.form
			aria-labelledby="post-practice-heading"
			onSubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
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
			<section
				aria-labelledby="post-practice-heading"
				className="rounded-2xl p-5 text-center"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<motion.span
					aria-hidden="true"
					className="inline-block"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
				>
					<CheckCircle
						size={48}
						style={{ color: "var(--color-primary)" }}
						className="mx-auto mb-3"
					/>
				</motion.span>
				<h2 id="post-practice-heading" className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">
					{t("practice.journal_title")}
				</h2>
				{sessionSummary && (
					<dl className="flex justify-center gap-4 mt-3">
						<div className="text-center">
							<dd
								className="text-lg font-bold"
								style={{ color: "var(--color-primary)" }}
							>
								{formatTime(sessionSummary.globalElapsedSec || 0)}
							</dd>
							<dt
								className="text-[10px] uppercase tracking-wider"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("practice.duration")}
							</dt>
						</div>
						<div className="text-center">
							<dd
								className="text-lg font-bold"
								style={{ color: "var(--color-secondary)" }}
							>
								{sessionSummary.blocksCompleted || 0}
							</dd>
							<dt
								className="text-[10px] uppercase tracking-wider"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("practice.blocks_completed")}
							</dt>
						</div>
					</dl>
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
					<section
						aria-labelledby="post-practice-micro-heading"
						className="mt-4 rounded-xl px-3 py-2 text-left"
						style={{ backgroundColor: "var(--color-surface)" }}
					>
						<h3
							id="post-practice-micro-heading"
							className="text-[11px] font-semibold mb-1"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("practice.micro_title")}
						</h3>
						<ul className="flex flex-col gap-1 list-none m-0 p-0">
							{tutorMicroAchievements.map((item) => (
								<li
									key={item}
									className="text-[11px]"
									style={{ color: "var(--color-text-secondary)" }}
								>
									<span aria-hidden="true">• </span>
									{item}
								</li>
							))}
						</ul>
					</section>
				)}
			</section>

			{/* Mood after */}
			<JournalCard
				title={
					isTutorMode
						? t("practice.checkout_signal")
						: t("practice.journal_mood_after")
				}
				subtitle={
					isTutorMode
						? null
						: "Choose up to three words that best match your state right now."
				}
				tone="soft"
			>
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
					<div className="flex flex-wrap gap-2.5">
						{MOOD_AFTER_OPTIONS.map((m) => {
							const selected = moodAfter.includes(m);
							const color = getMoodColor(m);
							return (
								<button
									type="button"
									key={m}
									onClick={() => toggleMood(m)}
									className="px-4 py-2 rounded-full text-sm font-semibold capitalize transition-transform duration-200 hover:-translate-y-0.5"
									style={{
										background: selected
											? `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color} 82%, black 18%) 100%)`
											: "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, white 8%) 0%, var(--color-surface) 100%)",
										color: selected ? "white" : "var(--color-text-secondary)",
										border: `1px solid ${selected ? color : "color-mix(in srgb, var(--color-border-soft) 75%, transparent)"}`,
										boxShadow: selected
											? "0 10px 24px rgba(25, 40, 72, 0.12)"
											: "none",
									}}
								>
									{t(`session.moods.${m}`)}
								</button>
							);
						})}
					</div>
				)}
			</JournalCard>

			{/* Energy & Stress */}
			{!isTutorMode && (
				<JournalCard
					title="Body Check"
					subtitle="A quick read of your current energy and nervous system load."
				>
					<section
						aria-label={t("practice.journal_energy_after", { n: energyAfter })}
						className="grid gap-4 lg:grid-cols-2"
					>
						<SliderPanel
							id="post-practice-energy"
							label={t("practice.journal_energy_after", { n: energyAfter })}
							value={energyAfter}
							onChange={(e) => setEnergyAfter(+e.target.value)}
							accent="var(--color-primary)"
							lowLabel={t("journal_form.slider_low_energy")}
							highLabel={t("journal_form.slider_high_energy")}
						/>
						<SliderPanel
							id="post-practice-stress"
							label={t("practice.journal_stress_after", { n: stressAfter })}
							value={stressAfter}
							onChange={(e) => setStressAfter(+e.target.value)}
							accent="var(--color-danger)"
							lowLabel={t("journal_form.slider_low_stress")}
							highLabel={t("journal_form.slider_high_stress")}
						/>
					</section>
				</JournalCard>
			)}

			{/* Physical sensations */}
			{!isTutorMode && (
				<JournalCard
					title={t("practice.journal_sensations")}
					subtitle="Notice the clearest body sensations that are present after practice."
				>
					<SensationChips
						value={physicalSensations}
						onToggle={toggleSensation}
						getLabel={(s) => t(`journal.sensations.${s}`)}
					/>
				</JournalCard>
			)}

			{/* Free-form notes */}
			<section
				aria-label={t("practice.journal_emotional_notes")}
				className="rounded-2xl p-5 flex flex-col gap-4"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<div>
					<label
						htmlFor="post-practice-notes"
						className="text-sm font-medium mb-2 block"
						style={{ color: "var(--color-text-primary)" }}
					>
						{isTutorMode
							? t("practice.tutor_notes")
							: t("practice.journal_emotional_notes")}
					</label>
					<textarea
						id="post-practice-notes"
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
					<label
						htmlFor="post-practice-gratitude"
						className="text-sm font-medium mb-2 block"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("practice.journal_gratitude")}
					</label>
					<textarea
						id="post-practice-gratitude"
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
					<label
						htmlFor="post-practice-learnings"
						className="text-sm font-medium mb-2 block"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("practice.journal_learnings")}
					</label>
					<textarea
						id="post-practice-learnings"
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
			</section>

			{/* Error banner */}
			{error && (
				<motion.div
					role="alert"
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
							aria-label={t("ui.close_modal")}
							className="ml-2 text-xs font-bold"
							style={{ color: "var(--color-text-muted)" }}
						>
							<span aria-hidden="true">✕</span>
						</button>
					)}
				</motion.div>
			)}

			{/* Save */}
			<Button
				type="submit"
				disabled={saving}
				loading={saving}
				size="lg"
				className="w-full"
			>
				{error ? t("practice.retry_save") : t("practice.save_journal")}
			</Button>
		</motion.form>
	);
}

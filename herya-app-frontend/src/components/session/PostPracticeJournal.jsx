import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import PostPracticeNudge from "./PostPracticeNudge";
import { GARDEN_MOOD_ORDER, MOOD_COLORS } from "@/utils/constants";

const getMoodColor = (mood) => MOOD_COLORS[mood] || "var(--color-secondary)";

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

export default function PostPracticeJournal({
	sessionSummary,
	checkInData,
	onSave,
	saving,
}) {
	const { t } = useLanguage();
	const [moodAfter, setMoodAfter] = useState([]);
	const [energyAfter, setEnergyAfter] = useState(5);
	const [stressAfter, setStressAfter] = useState(5);
	const [physicalSensations, setPhysicalSensations] = useState([]);
	const [emotionalNotes, setEmotionalNotes] = useState("");
	const [gratitude, setGratitude] = useState("");
	const [learnings, setLearnings] = useState("");

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
		const normalizedMoodBefore =
			checkInData?.mood?.length > 0 ? checkInData.mood : ["focused"];
		const normalizedMoodAfter = moodAfter.length > 0 ? moodAfter : ["calm"];

		onSave({
			moodAfter: normalizedMoodAfter,
			energyLevel: {
				before: checkInData?.energyLevel || 5,
				after: energyAfter,
			},
			stressLevel: {
				before: checkInData?.stressLevel || 5,
				after: stressAfter,
			},
			physicalSensations: physicalSensations.join(", "),
			emotionalNotes,
			gratitude,
			insights: learnings,
			moodBefore: normalizedMoodBefore,
		});
	};

	const formatTime = (sec) => {
		const m = Math.floor(sec / 60);
		const s = sec % 60;
		return `${m}:${String(s).padStart(2, "0")}`;
	};

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
				<h2
					className="text-xl font-semibold mb-1"
					style={{
						fontFamily: '"DM Sans", sans-serif',
						color: "var(--color-text-primary)",
					}}
				>
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
					{t("practice.journal_mood_after")}
				</p>
				<div className="flex flex-wrap gap-2">
					{GARDEN_MOOD_ORDER.map((m) => {
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
			</div>

			{/* Energy & Stress */}
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

			{/* Physical sensations */}
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
						{t("practice.journal_emotional_notes")}
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

			{/* Save */}
			<Button
				onClick={handleSave}
				disabled={saving}
				loading={saving}
				size="lg"
				className="w-full"
			>
				{t("practice.save_journal")}
			</Button>
		</motion.div>
	);
}

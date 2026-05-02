import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { PHASE_COLORS, PHASE_LABEL_KEYS } from "@/config/techniqueProfiles";
import { useLanguage } from "@/context/LanguageContext";
import useBreathingEngine from "@/hooks/useBreathingEngine";
import { PRANAYAMA_PATTERNS } from "@/utils/constants";

const PHASE_KEYS = ["inhale", "hold", "exhale", "holdAfterExhale"];

// Map legacy keys (hold1/hold2) to standard keys
function normalizeLegacyPattern(p) {
	return {
		inhale: p.inhale || 0,
		hold: p.hold1 ?? p.hold ?? 0,
		exhale: p.exhale || 0,
		holdAfterExhale: p.hold2 ?? p.holdAfterExhale ?? 0,
	};
}

export default function PranayamaMetronome({ patternKey = "4-4-4-4" }) {
	const { t } = useLanguage();
	const [selectedKey, setSelectedKey] = useState(patternKey);

	const currentPattern =
		PRANAYAMA_PATTERNS[selectedKey] || PRANAYAMA_PATTERNS["4-4-4-4"];

	const phaseDurations = useMemo(
		() => normalizeLegacyPattern(currentPattern),
		[currentPattern],
	);

	const activePhases = useMemo(
		() => PHASE_KEYS.filter((k) => phaseDurations[k] > 0),
		[phaseDurations],
	);

	const engine = useBreathingEngine({
		activePhases,
		phaseDurations,
		targetCycles: 999, // unlimited for standalone metronome
		pauseBetween: 0,
	});

	const handleSelectPattern = (key) => {
		engine.reset();
		setSelectedKey(key);
	};

	const color = PHASE_COLORS[engine.currentPhaseKey] || PHASE_COLORS.inhale;
	const scale =
		engine.currentPhaseKey === "inhale"
			? 1.3
			: engine.currentPhaseKey === "exhale"
				? 0.85
				: 1;

	const reducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

	return (
		<section
			aria-label="Pranayama Metronome"
			className="flex flex-col items-center gap-6 py-6"
		>
			{/* Pattern selector */}
			<ul
				className="flex gap-2 flex-wrap justify-center list-none m-0 p-0"
				aria-label="Patterns"
			>
				{Object.entries(PRANAYAMA_PATTERNS).map(([key, p]) => (
					<li key={key}>
						<button
							type="button"
							aria-pressed={selectedKey === key}
							onClick={() => handleSelectPattern(key)}
							className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
							style={
								selectedKey === key
									? {
											backgroundColor: "var(--color-primary)",
											color: "white",
											boxShadow: "var(--shadow-button)",
										}
									: {
											backgroundColor: "var(--color-surface-card)",
											color: "var(--color-text-secondary)",
											border: "1px solid var(--color-border-soft)",
										}
							}
						>
							{p.nameKey ? t(p.nameKey) : p.name}
						</button>
					</li>
				))}
			</ul>

			{/* Main circle */}
			<div className="relative flex items-center justify-center">
				{engine.isRunning && !reducedMotion && (
					<motion.span
						aria-hidden="true"
						className="absolute rounded-full border-4 opacity-20"
						style={{
							borderColor: color,
							width: 180,
							height: 180,
						}}
						animate={{ scale: [1, 1.15], opacity: [0.2, 0] }}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeOut",
						}}
					/>
				)}
				<motion.div
					role="status"
					aria-live="polite"
					className="w-44 h-44 rounded-full flex flex-col items-center justify-center shadow-lg"
					animate={{
						scale: engine.isRunning && !reducedMotion ? scale : 1,
					}}
					transition={{
						duration: engine.currentPhaseDuration,
						ease:
							engine.currentPhaseKey === "inhale"
								? "easeIn"
								: engine.currentPhaseKey === "exhale"
									? "easeOut"
									: "linear",
					}}
					style={{
						backgroundColor: `${color}18`,
						border: `4px solid ${color}`,
					}}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={engine.currentPhaseKey}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="text-center"
						>
							<p className="font-semibold text-lg" style={{ color }}>
								{t(
									PHASE_LABEL_KEYS[engine.currentPhaseKey] ||
										"pranayama.inhale",
								)}
							</p>
							<p className="text-3xl font-bold tabular-nums" style={{ color }}>
								{engine.isRunning
									? Math.ceil(engine.phaseRemaining)
									: Math.ceil(engine.currentPhaseDuration)}
							</p>
						</motion.div>
					</AnimatePresence>
				</motion.div>
			</div>

			{/* Cycle count */}
			<p
				className="text-sm font-medium"
				style={{ color: "var(--color-text-secondary)" }}
			>
				{engine.completedCycles}{" "}
				{engine.completedCycles === 1
					? t("pranayama.cycles_one", { n: engine.completedCycles })
					: t("pranayama.cycles_other", { n: engine.completedCycles })}
			</p>

			{/* Controls */}
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={() => {
						engine.reset();
					}}
					className="w-11 h-11 rounded-full flex items-center justify-center border"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: "var(--color-border-soft)",
						color: "var(--color-text-muted)",
					}}
					aria-label={t("guided.reset")}
				>
					<RotateCcw size={18} aria-hidden="true" />
				</button>
				<motion.button
					type="button"
					whileTap={{ scale: 0.92 }}
					onClick={engine.toggle}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
					style={{ backgroundColor: color }}
					aria-pressed={engine.isRunning}
					aria-label={engine.isRunning ? t("guided.pause") : t("guided.play")}
				>
					{engine.isRunning ? (
						<Pause size={24} aria-hidden="true" />
					) : (
						<Play size={24} aria-hidden="true" className="ml-0.5" />
					)}
				</motion.button>
			</div>

			{/* Phase labels */}
			<dl className="flex gap-3 flex-wrap justify-center">
				{activePhases.map((phase) => (
					<div
						key={phase}
						className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all"
						style={{
							backgroundColor:
								phase === engine.currentPhaseKey
									? `${PHASE_COLORS[phase]}15`
									: "transparent",
						}}
					>
						<dt
							className="text-[10px] font-semibold uppercase"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t(PHASE_LABEL_KEYS[phase] || "pranayama.inhale")}
						</dt>
						<dd
							className="text-lg font-bold tabular-nums m-0"
							style={{ color: PHASE_COLORS[phase] }}
						>
							{phaseDurations[phase]}s
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

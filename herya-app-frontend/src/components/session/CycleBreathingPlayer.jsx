import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Settings2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import SafetyBanner from "./SafetyBanner";

const PHASE_KEYS = ["inhale", "hold", "exhale", "holdAfterExhale"];
const PHASE_COLORS = {
	inhale: "var(--color-pranayama-inhale, #4A72FF)",
	hold: "var(--color-pranayama-hold, #FFB347)",
	exhale: "var(--color-pranayama-exhale, #5DB075)",
	holdAfterExhale: "var(--color-pranayama-hold2, #9B5DE5)",
};
const PHASE_LABELS_KEY = {
	inhale: "pranayama.inhale",
	hold: "pranayama.hold",
	exhale: "pranayama.exhale",
	holdAfterExhale: "pranayama.hold",
};

export default function CycleBreathingPlayer({
	pattern,
	config = {},
	onComplete,
	onCycleComplete,
}) {
	const { t } = useLanguage();

	// Calculate actual phase durations from pattern data
	const phaseDurations = useMemo(() => {
		if (!pattern) return { inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0 };

		const ratio = config.customRatio || pattern.patternRatio || {};
		const base = pattern.baseBreathDuration || 4;

		return {
			inhale: (ratio.inhale || 0) * base,
			hold: (ratio.hold || 0) * base,
			exhale: (ratio.exhale || 0) * base,
			holdAfterExhale: (ratio.holdAfterExhale || 0) * base,
		};
	}, [pattern, config.customRatio]);

	// Active phases (skip zero-duration phases)
	const activePhases = useMemo(
		() => PHASE_KEYS.filter((k) => phaseDurations[k] > 0),
		[phaseDurations],
	);

	const totalCycleDuration = useMemo(
		() => activePhases.reduce((sum, k) => sum + phaseDurations[k], 0),
		[activePhases, phaseDurations],
	);

	const targetCycles =
		config.cycles ||
		pattern?.recommendedPractice?.cycles?.default ||
		10;
	const pauseBetween = config.pauseBetweenCycles || 0;

	const [isRunning, setIsRunning] = useState(false);
	const [phaseIdx, setPhaseIdx] = useState(0);
	const [tick, setTick] = useState(0);
	const [completedCycles, setCompletedCycles] = useState(0);
	const [isPausing, setIsPausing] = useState(false); // pause between cycles
	const [pauseTick, setPauseTick] = useState(0);
	const [showSettings, setShowSettings] = useState(false);
	const intervalRef = useRef(null);
	const hapticRef = useRef(config.hapticFeedback !== false);

	const currentPhaseKey = activePhases[phaseIdx] || "inhale";
	const currentPhaseDuration = phaseDurations[currentPhaseKey] || 4;
	const color = PHASE_COLORS[currentPhaseKey];

	// Haptic feedback
	const vibrate = useCallback((ms = 50) => {
		if (hapticRef.current && navigator.vibrate) {
			navigator.vibrate(ms);
		}
	}, []);

	// Phase advancement
	const advancePhase = useCallback(() => {
		setPhaseIdx((prev) => {
			const next = (prev + 1) % activePhases.length;
			if (next === 0) {
				// Completed a cycle
				setCompletedCycles((c) => {
					const newCount = c + 1;
					onCycleComplete?.(newCount);
					vibrate(100);

					if (newCount >= targetCycles) {
						setIsRunning(false);
						setTimeout(() => onComplete?.(), 300);
						return newCount;
					}

					// Start pause between cycles if configured
					if (pauseBetween > 0) {
						setIsPausing(true);
						setPauseTick(0);
					}

					return newCount;
				});
			} else {
				vibrate(30);
			}
			return next;
		});
		setTick(0);
	}, [activePhases.length, targetCycles, pauseBetween, vibrate, onCycleComplete, onComplete]);

	// Main timer
	useEffect(() => {
		if (!isRunning) {
			clearInterval(intervalRef.current);
			return;
		}

		intervalRef.current = setInterval(() => {
			if (isPausing) {
				setPauseTick((pt) => {
					if (pt >= pauseBetween - 1) {
						setIsPausing(false);
						return 0;
					}
					return pt + 1;
				});
			} else {
				setTick((t) => {
					if (t >= currentPhaseDuration - 1) {
						advancePhase();
						return 0;
					}
					return t + 1;
				});
			}
		}, 1000);

		return () => clearInterval(intervalRef.current);
	}, [isRunning, isPausing, currentPhaseDuration, pauseBetween, advancePhase]);

	const reset = () => {
		setIsRunning(false);
		setPhaseIdx(0);
		setTick(0);
		setCompletedCycles(0);
		setIsPausing(false);
		setPauseTick(0);
	};

	// Circle scale animation
	const scale = useMemo(() => {
		if (isPausing) return 1;
		if (currentPhaseKey === "inhale") return 1.3;
		if (currentPhaseKey === "exhale") return 0.8;
		return 1;
	}, [currentPhaseKey, isPausing]);

	const ratioStr = pattern
		? `${pattern.patternRatio?.inhale || 0}:${pattern.patternRatio?.hold || 0}:${pattern.patternRatio?.exhale || 0}:${pattern.patternRatio?.holdAfterExhale || 0}`
		: "";

	if (!pattern) return null;

	return (
		<div className="flex flex-col items-center gap-5 py-2">
			{/* Header */}
			<div className="text-center">
				<p
					className="text-xs font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-secondary)" }}
				>
					{pattern.romanizationName}
				</p>
				{pattern.sanskritName && (
					<p
						className="text-xs"
						style={{ color: "var(--color-text-muted)", fontFamily: "serif" }}
					>
						{pattern.sanskritName}
					</p>
				)}
				<p
					className="text-sm font-bold mt-1"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("guided.cycle_progress", {
						current: completedCycles,
						total: targetCycles,
					})}
				</p>
			</div>

			{/* Main circle */}
			<div className="relative flex items-center justify-center">
				{isRunning && !isPausing && (
					<motion.div
						className="absolute rounded-full border-4 opacity-20"
						style={{ borderColor: color, width: 180, height: 180 }}
						animate={{ scale: [1, 1.15], opacity: [0.2, 0] }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
					/>
				)}
				<motion.div
					className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg"
					animate={{
						scale: isRunning ? scale : 1,
					}}
					transition={{
						duration: currentPhaseDuration,
						ease:
							currentPhaseKey === "inhale"
								? "easeIn"
								: currentPhaseKey === "exhale"
									? "easeOut"
									: "linear",
					}}
					style={{
						backgroundColor: `${color}20`,
						border: `4px solid ${color}`,
					}}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={isPausing ? "pause" : currentPhaseKey}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							className="text-center"
						>
							{isPausing ? (
								<>
									<p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
										{t("guided.pause_between")}
									</p>
									<p className="text-3xl font-bold" style={{ color: "var(--color-text-muted)" }}>
										{pauseBetween - pauseTick}
									</p>
								</>
							) : (
								<>
									<p className="font-semibold text-base" style={{ color }}>
										{t(PHASE_LABELS_KEY[currentPhaseKey])}
									</p>
									<p className="text-3xl font-bold" style={{ color }}>
										{isRunning
											? currentPhaseDuration - tick
											: currentPhaseDuration}
									</p>
								</>
							)}
						</motion.div>
					</AnimatePresence>
				</motion.div>
			</div>

			{/* Phase bar */}
			<div className="flex gap-1 w-full max-w-xs">
				{activePhases.map((phase) => {
					const dur = phaseDurations[phase];
					const pct = (dur / totalCycleDuration) * 100;
					const isActive = phase === currentPhaseKey && !isPausing;
					const progress = isActive ? tick / dur : 0;

					return (
						<div
							key={phase}
							className="relative h-2 rounded-full overflow-hidden"
							style={{
								width: `${pct}%`,
								backgroundColor: `${PHASE_COLORS[phase]}30`,
							}}
						>
							{isActive && (
								<motion.div
									className="absolute inset-y-0 left-0 rounded-full"
									style={{ backgroundColor: PHASE_COLORS[phase] }}
									animate={{ width: `${progress * 100}%` }}
									transition={{ duration: 0.3 }}
								/>
							)}
							{!isActive &&
								activePhases.indexOf(phase) <
									activePhases.indexOf(currentPhaseKey) && (
									<div
										className="absolute inset-0 rounded-full"
										style={{
											backgroundColor: PHASE_COLORS[phase],
										}}
									/>
								)}
						</div>
					);
				})}
			</div>

			{/* Phase labels */}
			<div className="flex gap-3 justify-center">
				{activePhases.map((phase) => (
					<div
						key={phase}
						className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all"
						style={{
							backgroundColor:
								phase === currentPhaseKey && !isPausing
									? `${PHASE_COLORS[phase]}15`
									: "transparent",
						}}
					>
						<span
							className="text-[10px] font-semibold uppercase"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t(PHASE_LABELS_KEY[phase])}
						</span>
						<span
							className="text-sm font-bold"
							style={{ color: PHASE_COLORS[phase] }}
						>
							{phaseDurations[phase]}s
						</span>
					</div>
				))}
			</div>

			{/* Cycle dots */}
			{targetCycles <= 20 && (
				<div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
					{Array.from({ length: targetCycles }).map((_, i) => (
						<div
							key={i}
							className="w-2.5 h-2.5 rounded-full transition-all"
							style={{
								backgroundColor:
									i < completedCycles
										? "var(--color-secondary)"
										: "var(--color-border-soft)",
							}}
						/>
					))}
				</div>
			)}

			{/* Ratio display */}
			<p
				className="text-xs font-mono font-bold"
				style={{ color: "var(--color-text-muted)" }}
			>
				{t("guided.ratio")}: {ratioStr}
			</p>

			{/* Controls */}
			<div className="flex items-center gap-4">
				<button
					type="button"
					onClick={reset}
					className="w-11 h-11 rounded-full flex items-center justify-center border"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: "var(--color-border-soft)",
						color: "var(--color-text-muted)",
					}}
					aria-label={t("guided.reset")}
				>
					<RotateCcw size={18} />
				</button>
				<motion.button
					whileTap={{ scale: 0.92 }}
					onClick={() => setIsRunning((r) => !r)}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
					style={{ backgroundColor: color }}
					aria-label={isRunning ? t("guided.pause") : t("guided.play")}
				>
					{isRunning ? (
						<Pause size={24} />
					) : (
						<Play size={24} className="ml-0.5" />
					)}
				</motion.button>
			</div>

			{/* Safety */}
			{pattern.contraindications?.length > 0 && (
				<div className="w-full max-w-xs">
					<SafetyBanner
						contraindications={pattern.contraindications}
						warnings={pattern.warnings}
					/>
				</div>
			)}
		</div>
	);
}

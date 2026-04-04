import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Leaf, Eye, EyeOff, Bell } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const DEFAULT_PHASES = [
	{ type: "intro", pct: 15, key: "guided.meditation_intro" },
	{ type: "main", pct: 70, key: "guided.meditation_main" },
	{ type: "close", pct: 15, key: "guided.meditation_close" },
];

const MEDITATION_INSTRUCTIONS = {
	guided: {
		intro: "guided.meditation_guided_intro",
		main: "guided.meditation_guided_main",
		close: "guided.meditation_guided_close",
	},
	breath_awareness: {
		intro: "guided.meditation_breath_intro",
		main: "guided.meditation_breath_main",
		close: "guided.meditation_breath_close",
	},
	mantra: {
		intro: "guided.meditation_mantra_intro",
		main: "guided.meditation_mantra_main",
		close: "guided.meditation_mantra_close",
	},
	visualization: {
		intro: "guided.meditation_viz_intro",
		main: "guided.meditation_viz_main",
		close: "guided.meditation_viz_close",
	},
	silent: {
		intro: "guided.meditation_silent_intro",
		main: null,
		close: "guided.meditation_silent_close",
	},
};

const formatTime = (sec) => {
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function PhasedMeditationPlayer({
	meditationType = "guided",
	durationMinutes = 10,
	config = {},
	guided = true,
	lowStimMode = false,
	onComplete,
}) {
	const { t } = useLanguage();
	const totalSec = durationMinutes * 60;

	// Build phases with absolute durations
	const phases = useMemo(() => {
		return DEFAULT_PHASES.map((p) => ({
			...p,
			durationSec: Math.round((p.pct / 100) * totalSec),
		}));
	}, [totalSec]);

	const [isRunning, setIsRunning] = useState(false);
	const [elapsedSec, setElapsedSec] = useState(0);
	const [showGuide, setShowGuide] = useState(guided && !lowStimMode);
	const intervalRef = useRef(null);
	const bellAudioRef = useRef(null);
	const lastBellRef = useRef(0);

	const bellInterval = config.bellInterval || 0;
	const bellAtStart = config.bellAtStart !== false;
	const bellAtEnd = config.bellAtEnd !== false;

	// Play bell sound
	const playBell = useCallback((freq = 528, duration = 1.2) => {
		try {
			if (!bellAudioRef.current) {
				bellAudioRef.current = new AudioContext();
			}
			const ctx = bellAudioRef.current;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = freq;
			osc.type = "sine";
			gain.gain.setValueAtTime(0.12, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + duration);
		} catch {
			// Audio not available
		}
	}, []);

	// Timer
	useEffect(() => {
		if (!isRunning) {
			clearInterval(intervalRef.current);
			return;
		}

		// Bell at start
		if (elapsedSec === 0 && bellAtStart) {
			playBell(528, 1.5);
		}

		intervalRef.current = setInterval(() => {
			setElapsedSec((prev) => {
				const next = prev + 1;

				// Interval bells
				if (
					bellInterval > 0 &&
					next - lastBellRef.current >= bellInterval * 60
				) {
					playBell(440, 0.8);
					lastBellRef.current = next;
				}

				// Complete
				if (next >= totalSec) {
					setIsRunning(false);
					if (bellAtEnd) playBell(528, 2);
					setTimeout(() => onComplete?.(), 1000);
					return totalSec;
				}

				return next;
			});
		}, 1000);

		return () => clearInterval(intervalRef.current);
	}, [
		isRunning,
		totalSec,
		bellInterval,
		bellAtStart,
		bellAtEnd,
		playBell,
		elapsedSec,
		onComplete,
	]);

	// Current phase
	const currentPhase = useMemo(() => {
		let accumulated = 0;
		for (let i = 0; i < phases.length; i++) {
			accumulated += phases[i].durationSec;
			if (elapsedSec < accumulated) {
				return {
					index: i,
					phase: phases[i],
					phaseElapsed: elapsedSec - (accumulated - phases[i].durationSec),
					phaseRemaining: accumulated - elapsedSec,
				};
			}
		}
		return {
			index: phases.length - 1,
			phase: phases[phases.length - 1],
			phaseElapsed: phases[phases.length - 1].durationSec,
			phaseRemaining: 0,
		};
	}, [elapsedSec, phases]);

	const remaining = totalSec - elapsedSec;
	const instructions =
		MEDITATION_INSTRUCTIONS[meditationType] || MEDITATION_INSTRUCTIONS.guided;

	const phaseColors = {
		intro: "var(--color-accent)",
		main: "var(--color-primary)",
		close: "var(--color-secondary)",
	};
	const currentColor =
		phaseColors[currentPhase.phase.type] || "var(--color-accent)";

	return (
		<div className="flex flex-col items-center gap-5 py-2">
			{/* Header */}
			<div className="text-center">
				<p
					className="text-xs font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-accent)" }}
				>
					{t(`session.meditation_types.${meditationType}`)}
				</p>
			</div>

			{/* Phase indicators */}
			<div className="flex gap-2 w-full max-w-xs">
				{phases.map((phase, i) => {
					const pct = phase.pct;
					const isActive = i === currentPhase.index;
					const isComplete = i < currentPhase.index;
					const phaseProgress = isActive
						? currentPhase.phaseElapsed / phase.durationSec
						: 0;

					return (
						<div
							key={phase.type}
							className="flex flex-col items-center gap-1"
							style={{ width: `${pct}%` }}
						>
							<div
								className="w-full h-1.5 rounded-full overflow-hidden"
								style={{
									backgroundColor: `${phaseColors[phase.type]}20`,
								}}
							>
								<div
									className="h-full rounded-full transition-all duration-1000"
									style={{
										backgroundColor: phaseColors[phase.type],
										width: isComplete
											? "100%"
											: isActive
												? `${phaseProgress * 100}%`
												: "0%",
									}}
								/>
							</div>
							<span
								className="text-[9px] font-semibold uppercase"
								style={{
									color: isActive
										? phaseColors[phase.type]
										: "var(--color-text-muted)",
								}}
							>
								{t(`guided.phase_${phase.type}`)}
							</span>
						</div>
					);
				})}
			</div>

			{/* Main visual */}
			<div className="relative flex items-center justify-center my-4">
				{/* Breathing circle */}
				<motion.div
					className="w-44 h-44 rounded-full flex flex-col items-center justify-center"
					style={{
						backgroundColor: `${currentColor}10`,
						border: `3px solid ${currentColor}30`,
					}}
					animate={
						isRunning && !lowStimMode
							? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
							: { scale: 1, opacity: 1 }
					}
					transition={
						isRunning && !lowStimMode
							? { duration: 6, repeat: Infinity, ease: "easeInOut" }
							: {}
					}
				>
					<Leaf
						size={28}
						style={{ color: currentColor, opacity: 0.5 }}
						className="mb-2"
					/>
					<p
						className="text-2xl font-bold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{formatTime(remaining)}
					</p>
					<p
						className="text-[10px] font-medium mt-0.5"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.remaining")}
					</p>
				</motion.div>
			</div>

			{/* Instruction text */}
			{showGuide && guided && (
				<AnimatePresence mode="wait">
					<motion.div
						key={currentPhase.index}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="max-w-xs text-center px-4 py-3 rounded-xl"
						style={{
							backgroundColor: "var(--color-surface-card)",
							border: `1px solid ${currentColor}20`,
						}}
					>
						{instructions[currentPhase.phase.type] ? (
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{t(instructions[currentPhase.phase.type])}
							</p>
						) : (
							<p
								className="text-sm italic"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("guided.meditation_silence")}
							</p>
						)}
					</motion.div>
				</AnimatePresence>
			)}

			{/* Guide toggle */}
			{guided && (
				<button
					type="button"
					onClick={() => setShowGuide((g) => !g)}
					className="flex items-center gap-1.5 text-xs font-medium"
					style={{ color: "var(--color-accent)" }}
				>
					{showGuide ? <EyeOff size={12} /> : <Eye size={12} />}
					{showGuide
						? t("guided.hide_instructions")
						: t("guided.show_instructions")}
				</button>
			)}

			{/* Bell indicator */}
			{bellInterval > 0 && (
				<p
					className="text-[10px] flex items-center gap-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					<Bell size={10} />
					{t("guided.bell_every", { n: bellInterval })}
				</p>
			)}

			{/* Controls */}
			<div className="flex items-center gap-4">
				<motion.button
					whileTap={{ scale: 0.92 }}
					onClick={() => setIsRunning((r) => !r)}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
					style={{ backgroundColor: currentColor }}
					aria-label={isRunning ? t("guided.pause") : t("guided.play")}
				>
					{isRunning ? (
						<Pause size={24} />
					) : (
						<Play size={24} className="ml-0.5" />
					)}
				</motion.button>
			</div>
		</div>
	);
}

import { AnimatePresence, motion } from "framer-motion";
import {
	Accessibility,
	Pause,
	Play,
	RotateCcw,
	Vibrate,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	applyLowStim,
	getProfile,
	PHASE_COLORS,
	PHASE_LABEL_KEYS,
} from "@/config/techniqueProfiles";
import { useLanguage } from "@/context/LanguageContext";
import useBreathingEngine from "@/hooks/useBreathingEngine";
import usePranayamaAudio from "@/hooks/usePranayamaAudio";
import { localizedArray } from "@/utils/libraryHelpers";
import NostrilIndicator from "./NostrilIndicator";
import SafetyBanner from "./SafetyBanner";

const formatTime = (sec) => {
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Palette tints per profile style
const PALETTE_TINTS = {
	warm: {
		bg: "var(--color-prana-warm)",
		accent: "var(--color-prana-warm-accent)",
	},
	calming: {
		bg: "var(--color-prana-calming)",
		accent: "var(--color-prana-calming)",
	},
	cooling: {
		bg: "var(--color-prana-cooling)",
		accent: "var(--color-prana-cooling)",
	},
	energizing: {
		bg: "var(--color-prana-energizing)",
		accent: "var(--color-prana-energizing-accent)",
	},
	balanced: {
		bg: "var(--color-prana-balanced)",
		accent: "var(--color-prana-balanced)",
	},
};

export default function CycleBreathingPlayer({
	pattern,
	config = {},
	onComplete,
	onCycleComplete,
}) {
	const { t, lang } = useLanguage();

	// ── Resolve profile ──────────────────────────────────────────────────
	const baseProfile = useMemo(() => getProfile(pattern), [pattern]);
	const [lowStim, setLowStim] = useState(Boolean(config.lowStim));
	const profile = useMemo(
		() => (lowStim ? applyLowStim(baseProfile) : baseProfile),
		[baseProfile, lowStim],
	);

	// ── Audio & haptic settings ──────────────────────────────────────────
	const [audioEnabled, setAudioEnabled] = useState(true);
	const [hapticEnabled, setHapticEnabled] = useState(
		config.hapticFeedback !== false,
	);

	const audio = usePranayamaAudio({
		enabled: audioEnabled,
		guideVolume: lowStim ? 0.3 : 0.8,
		cueVolume: lowStim ? 0.4 : 1,
	});

	// ── Haptic helper ────────────────────────────────────────────────────
	const vibrate = useCallback(
		(ms) => {
			if (hapticEnabled && !lowStim && navigator.vibrate) {
				navigator.vibrate(ms);
			}
		},
		[hapticEnabled, lowStim],
	);

	// ── Custom ratio from config ─────────────────────────────────────────
	const phaseDurations = useMemo(() => {
		if (config.customRatio) {
			const base = pattern?.baseBreathDuration || profile.baseDuration;
			const ratio = config.customRatio;
			const basePhaseDurations = {
				inhale: (ratio.inhale || 0) * base,
				hold: (ratio.hold || 0) * base,
				exhale: (ratio.exhale || 0) * base,
				holdAfterExhale: (ratio.holdAfterExhale || 0) * base,
			};
			return Object.fromEntries(
				profile.phaseSequence
					.map((step) => [
						step.key,
						(basePhaseDurations[step.phaseKey] || 0) *
							(step.durationMultiplier ?? 1),
					])
					.filter(([, duration]) => duration > 0),
			);
		}
		return profile.phaseDurations;
	}, [config.customRatio, pattern, profile]);

	const enginePhases = useMemo(
		() =>
			profile.enginePhases.filter((phaseKey) => phaseDurations[phaseKey] > 0),
		[phaseDurations, profile.enginePhases],
	);
	const runtimePhaseSequence = useMemo(
		() => profile.phaseSequence.filter((step) => phaseDurations[step.key] > 0),
		[phaseDurations, profile.phaseSequence],
	);

	const targetCycles =
		config.cycles || pattern?.recommendedPractice?.cycles?.default || 10;
	const pauseBetween =
		config.pauseBetweenCycles ?? profile.pauseBetweenCycles ?? 0;

	// ── Breathing engine ─────────────────────────────────────────────────
	const handlePhaseChange = useCallback(() => {
		audio.playPhaseChange(profile.audio);
		vibrate(profile.haptic?.phaseChange || 0);
	}, [audio, profile, vibrate]);

	const handleCycleComplete = useCallback(
		(count) => {
			onCycleComplete?.(count);
			vibrate(profile.haptic?.roundChange || 60);
			audio.playRoundChange(profile.audio);
		},
		[onCycleComplete, vibrate, audio, profile],
	);

	const engine = useBreathingEngine({
		activePhases: enginePhases,
		phaseDurations,
		targetCycles,
		pauseBetween,
		onPhaseChange: handlePhaseChange,
		onCycleComplete: handleCycleComplete,
		onComplete,
	});

	// ── Play phase guide sound when phase changes ────────────────────────
	const prevPhaseRef = useRef(null);
	const currentStep =
		runtimePhaseSequence[engine.phaseIdx] || runtimePhaseSequence[0];
	const currentPhaseKey = currentStep?.phaseKey || engine.currentPhaseKey;
	const currentNostrilFlow = currentStep?.nostrilFlow || "both";

	useEffect(() => {
		if (!engine.isRunning || engine.isPausing) return;
		const key = currentPhaseKey;
		if (key !== prevPhaseRef.current) {
			prevPhaseRef.current = key;
			audio.playPhaseGuide(key, profile.audio, engine.currentPhaseDuration);
		}
	}, [
		engine.isRunning,
		engine.isPausing,
		engine.currentPhaseKey,
		engine.currentPhaseDuration,
		audio,
		profile.audio,
		currentPhaseKey,
	]);

	// ── Reduced motion ───────────────────────────────────────────────────
	const reducedMotion =
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

	// ── Derived UI values ────────────────────────────────────────────────
	const color = PHASE_COLORS[currentPhaseKey] || PHASE_COLORS.inhale;
	const anim = profile.animation[currentPhaseKey] || {
		scale: 1,
		ease: "linear",
	};
	const paletteTint =
		PALETTE_TINTS[profile.visual?.palette] || PALETTE_TINTS.balanced;
	const totalCycleDuration = enginePhases.reduce(
		(sum, k) => sum + (phaseDurations[k] || 0),
		0,
	);
	const displayPhaseDurations = useMemo(
		() =>
			profile.activePhases.reduce((acc, phase) => {
				acc[phase] = runtimePhaseSequence
					.filter((step) => step.phaseKey === phase)
					.reduce((sum, step) => sum + (phaseDurations[step.key] || 0), 0);
				return acc;
			}, {}),
		[phaseDurations, profile.activePhases, runtimePhaseSequence],
	);
	const displayActivePhases = useMemo(
		() =>
			profile.activePhases.filter(
				(phase) => (displayPhaseDurations[phase] || 0) > 0,
			),
		[displayPhaseDurations, profile.activePhases],
	);

	const ratioStr = pattern
		? `${pattern.patternRatio?.inhale || 0}:${pattern.patternRatio?.hold || 0}:${pattern.patternRatio?.exhale || 0}:${pattern.patternRatio?.holdAfterExhale || 0}`
		: "";

	// Total estimated time (exact, no approximation symbol)
	const totalEstimatedSec =
		targetCycles * totalCycleDuration +
		Math.max(0, targetCycles - 1) * pauseBetween;

	if (!pattern) return null;

	const showCompletionState = engine.finished;

	return (
		<section
			aria-label={pattern.romanizationName}
			className="flex flex-col items-center gap-4 py-2"
		>
			{/* Header */}
			<header className="text-center">
				<h3
					className="text-xs font-semibold uppercase tracking-widest m-0"
					style={{ color: paletteTint.accent }}
				>
					{pattern.romanizationName}
				</h3>
				{pattern.sanskritName && (
					<p
						className="text-xs mt-0.5"
						style={{
							color: "var(--color-text-muted)",
							fontFamily: "serif",
						}}
					>
						{pattern.sanskritName}
					</p>
				)}
			</header>

			{/* Cycle counter — always visible */}
			<div
				className="text-center"
				role="status"
				aria-live="polite"
				aria-atomic="true"
			>
				<p
					className="text-sm font-bold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{showCompletionState
						? t("pranayama.cycles_completed", {
								current: engine.completedCycles,
								total: targetCycles,
							})
						: t("guided.cycle_progress", {
								current: engine.visibleCycle,
								total: targetCycles,
							})}
				</p>
				{!engine.isRunning && !showCompletionState && totalEstimatedSec > 0 && (
					<p
						className="text-xs mt-0.5"
						style={{ color: "var(--color-text-muted)" }}
					>
						{formatTime(totalEstimatedSec)}
					</p>
				)}
			</div>

			{/* Nostril indicator for alternate-nostril techniques */}
			{runtimePhaseSequence.some((step) => step.nostrilFlow !== "both") &&
				engine.isRunning && (
					<NostrilIndicator
						nostrilFlow={currentNostrilFlow}
						phaseKey={currentPhaseKey}
						color={color}
					/>
				)}

			{/* Main breathing circle */}
			<div className="relative flex items-center justify-center">
				{/* Ripple effect (respects reduced motion) */}
				{engine.isRunning && !engine.isPausing && !reducedMotion && (
					<motion.div
						className="absolute rounded-full border-4 opacity-20"
						style={{
							borderColor: color,
							width: 172,
							height: 172,
						}}
						animate={{ scale: [1, 1.12], opacity: [0.2, 0] }}
						transition={{
							duration: 2,
							repeat: Infinity,
							ease: "easeOut",
						}}
					/>
				)}

				<motion.div
					className="w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-lg"
					animate={{
						scale:
							engine.isRunning && !engine.isPausing && !reducedMotion
								? anim.scale
								: 1,
					}}
					transition={{
						duration: engine.currentPhaseDuration,
						ease: reducedMotion
							? "linear"
							: Array.isArray(anim.ease)
								? anim.ease
								: anim.ease || "easeInOut",
					}}
					style={{
						backgroundColor: `${color}18`,
						border: `4px solid ${color}`,
					}}
					role="img"
					aria-label={t(
						PHASE_LABEL_KEYS[currentPhaseKey] || "pranayama.inhale",
					)}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={engine.isPausing ? "pause" : engine.currentPhaseKey}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.15 }}
							className="text-center"
						>
							{engine.isPausing ? (
								<>
									<p
										className="text-sm font-semibold"
										style={{
											color: "var(--color-text-muted)",
										}}
									>
										{t("guided.pause_between")}
									</p>
									<p
										className="text-3xl font-bold"
										style={{
											color: "var(--color-text-muted)",
										}}
									>
										{Math.ceil(pauseBetween - engine.pauseElapsed)}
									</p>
								</>
							) : showCompletionState ? (
								<p
									className="text-base font-semibold"
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									{t("pranayama.practice_complete")}
								</p>
							) : (
								<>
									<p className="font-semibold text-base" style={{ color }}>
										{t(PHASE_LABEL_KEYS[currentPhaseKey] || "pranayama.inhale")}
									</p>
									<p
										className="text-3xl font-bold tabular-nums"
										style={{ color }}
									>
										{engine.isRunning
											? Math.ceil(engine.phaseRemaining)
											: Math.ceil(engine.currentPhaseDuration)}
									</p>
								</>
							)}
						</motion.div>
					</AnimatePresence>
				</motion.div>
			</div>

			{/* Phase progress bar */}
			<div
				className="flex gap-1 w-full max-w-xs"
				role="progressbar"
				aria-valuenow={engine.phaseProgress * 100}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				{enginePhases.map((phase) => {
					const step = profile.phaseSequence.find((item) => item.key === phase);
					const phaseKey = step?.phaseKey || phase;
					const dur = phaseDurations[phase];
					const pct = (dur / totalCycleDuration) * 100;
					const isActive =
						phase === engine.currentPhaseKey && !engine.isPausing;
					const isCompleted =
						enginePhases.indexOf(phase) <
						enginePhases.indexOf(engine.currentPhaseKey);

					return (
						<div
							key={phase}
							className="relative h-2 rounded-full overflow-hidden"
							style={{
								width: `${pct}%`,
								backgroundColor: `${PHASE_COLORS[phaseKey]}25`,
							}}
						>
							{isActive && (
								<motion.div
									className="absolute inset-y-0 left-0 rounded-full"
									style={{
										backgroundColor: PHASE_COLORS[phaseKey],
									}}
									animate={{
										width: `${engine.phaseProgress * 100}%`,
									}}
									transition={{ duration: 0.1, ease: "linear" }}
								/>
							)}
							{isCompleted && (
								<div
									className="absolute inset-0 rounded-full"
									style={{
										backgroundColor: PHASE_COLORS[phaseKey],
									}}
								/>
							)}
						</div>
					);
				})}
			</div>

			{/* Phase labels with durations */}
			<dl className="flex gap-2 justify-center flex-wrap">
				{displayActivePhases.map((phase) => (
					<div
						key={phase}
						className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all"
						style={{
							backgroundColor:
								phase === currentPhaseKey && !engine.isPausing
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
							className="text-sm font-bold tabular-nums m-0"
							style={{ color: PHASE_COLORS[phase] }}
						>
							{displayPhaseDurations[phase]}s
						</dd>
					</div>
				))}
			</dl>

			{/* Cycle dots */}
			{targetCycles <= 20 && (
				<div
					className="flex gap-1.5 flex-wrap justify-center max-w-xs"
					role="img"
					aria-label={t("pranayama.cycles_completed", {
						current: engine.completedCycles,
						total: targetCycles,
					})}
				>
					{Array.from({ length: targetCycles }, (_, idx) => {
						const cycleNum = idx + 1;
						return (
							<div
								key={`cycle-${cycleNum}`}
								className="w-2.5 h-2.5 rounded-full transition-all duration-300"
								style={{
									backgroundColor:
										idx < engine.completedCycles
											? paletteTint.accent
											: "var(--color-border-soft)",
									transform:
										idx === engine.completedCycles && engine.isRunning
											? "scale(1.3)"
											: "scale(1)",
								}}
							/>
						);
					})}
				</div>
			)}

			{/* Ratio display */}
			{ratioStr && (
				<p
					className="text-xs font-mono font-bold"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("guided.ratio")}: {ratioStr}
				</p>
			)}

			{/* Stimulation level badge */}
			{profile.stimulation === "high" && !lowStim && (
				<div
					className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
					style={{
						backgroundColor: "var(--color-error-bg)",
						color: "var(--color-error-text)",
					}}
					role="alert"
				>
					{t("pranayama.high_stimulation")}
				</div>
			)}

			{/* Safety warnings */}
			{profile.safety?.showWarning && (
				<div className="w-full max-w-xs">
					<SafetyBanner
						contraindications={
							localizedArray(pattern, "contraindications", lang).length > 0
								? localizedArray(pattern, "contraindications", lang)
								: pattern.contraindications || []
						}
						warnings={
							profile.safety.warningKey
								? t(profile.safety.warningKey)
								: pattern.warnings
						}
					/>
				</div>
			)}

			{/* Controls */}
			<div className="flex items-center gap-3 pt-1">
				{/* Reset */}
				<button
					type="button"
					onClick={engine.reset}
					className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: "var(--color-border-soft)",
						color: "var(--color-text-muted)",
					}}
					aria-label={t("guided.reset")}
				>
					<RotateCcw size={16} aria-hidden="true" />
				</button>

				{/* Play / Pause */}
				<motion.button
					type="button"
					whileTap={{ scale: 0.92 }}
					onClick={engine.toggle}
					disabled={showCompletionState}
					aria-pressed={engine.isRunning}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
					style={{ backgroundColor: color }}
					aria-label={engine.isRunning ? t("guided.pause") : t("guided.play")}
				>
					{engine.isRunning ? (
						<Pause size={24} aria-hidden="true" />
					) : (
						<Play size={24} aria-hidden="true" className="ml-0.5" />
					)}
				</motion.button>

				{/* Audio toggle */}
				<button
					type="button"
					onClick={() => setAudioEnabled((v) => !v)}
					className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
					style={{
						backgroundColor: audioEnabled
							? `${paletteTint.accent}15`
							: "var(--color-surface-card)",
						borderColor: audioEnabled
							? paletteTint.accent
							: "var(--color-border-soft)",
						color: audioEnabled
							? paletteTint.accent
							: "var(--color-text-muted)",
					}}
					aria-label={t(
						audioEnabled ? "pranayama.audio_on" : "pranayama.audio_off",
					)}
					aria-pressed={audioEnabled}
				>
					{audioEnabled ? (
						<Volume2 size={16} aria-hidden="true" />
					) : (
						<VolumeX size={16} aria-hidden="true" />
					)}
				</button>
			</div>

			{/* Secondary controls row */}
			<div className="flex items-center gap-3">
				{/* Haptic toggle */}
				{"vibrate" in navigator && (
					<button
						type="button"
						onClick={() => setHapticEnabled((v) => !v)}
						className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
						style={{
							backgroundColor: hapticEnabled
								? `${paletteTint.accent}10`
								: "var(--color-surface-card)",
							borderColor: hapticEnabled
								? `${paletteTint.accent}40`
								: "var(--color-border-soft)",
							color: hapticEnabled
								? paletteTint.accent
								: "var(--color-text-muted)",
						}}
						aria-label={t(
							hapticEnabled
								? "pranayama.vibration_on"
								: "pranayama.vibration_off",
						)}
						aria-pressed={hapticEnabled}
					>
						<Vibrate size={12} aria-hidden="true" />
						{t(
							hapticEnabled
								? "pranayama.vibration_on"
								: "pranayama.vibration_off",
						)}
					</button>
				)}

				{/* Low stimulation mode */}
				<button
					type="button"
					onClick={() => setLowStim((v) => !v)}
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
					style={{
						backgroundColor: lowStim
							? `${paletteTint.accent}10`
							: "var(--color-surface-card)",
						borderColor: lowStim
							? `${paletteTint.accent}40`
							: "var(--color-border-soft)",
						color: lowStim ? paletteTint.accent : "var(--color-text-muted)",
					}}
					aria-label={t("pranayama.low_stimulation")}
					aria-pressed={lowStim}
				>
					<Accessibility size={12} aria-hidden="true" />
					{t("pranayama.low_stimulation")}
				</button>
			</div>

			{/* Contraindications from pattern */}
			{!profile.safety?.showWarning &&
				pattern.contraindications?.length > 0 && (
					<div className="w-full max-w-xs">
						<SafetyBanner
							contraindications={
								localizedArray(pattern, "contraindications", lang).length > 0
									? localizedArray(pattern, "contraindications", lang)
									: pattern.contraindications
							}
							warnings={pattern.warnings}
						/>
					</div>
				)}
		</section>
	);
}

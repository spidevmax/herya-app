/**
 * Technique profiles for pranayama.
 *
 * Each profile defines the complete UX behaviour for a specific breathing
 * technique: phase order, animation curves, visual style, audio design,
 * haptic intensity, stimulation level, and safety rules.
 *
 * The engine reads the profile by matching `pattern.romanizationName` (case-
 * insensitive, trimmed). If no match is found, `_default` is used.
 *
 * Fields
 * ──────
 *  phaseOrder        – ordered list of phase keys for one cycle
 *  defaultRatio      – fallback ratio when backend data is missing
 *  baseDuration      – fallback baseBreathDuration (seconds per ratio unit)
 *  animation         – per-phase circle scale + easing curve
 *  visual            – per-phase colours, background tints, circle style
 *  audio             – per-phase Web-Audio descriptor (waveform, freq, envelope)
 *  haptic            – per-phase vibration duration in ms (0 = off)
 *  stimulation       – "low" | "medium" | "high" — drives low-stim mode
 *  safety            – beginner limits, max cycles, warnings
 *  pauseBetweenCycles – default pause seconds (0 = no pause)
 *  countBased        – true for techniques measured in rapid exhalations
 *  nostrilAlternation – true for Nadi Shodhana / Surya Bhedana style
 *  roundBased        – true for Kapalabhati / Bhastrika (rounds of pumps)
 */

// ── Phase key constants ─────────────────────────────────────────────────────
export const PHASE_KEYS = ["inhale", "hold", "exhale", "holdAfterExhale"];

// ── Colour palette ──────────────────────────────────────────────────────────
export const PHASE_COLORS = {
	inhale: "var(--color-pranayama-inhale, #4A90D9)",
	hold: "var(--color-pranayama-hold, #E8A838)",
	exhale: "var(--color-pranayama-exhale, #5DB075)",
	holdAfterExhale: "var(--color-pranayama-hold2, #9B7ECF)",
	rest: "var(--color-text-muted, #9CA3AF)",
};

// ── Translation keys per phase ──────────────────────────────────────────────
export const PHASE_LABEL_KEYS = {
	inhale: "pranayama.inhale",
	hold: "pranayama.hold",
	exhale: "pranayama.exhale",
	holdAfterExhale: "pranayama.hold_after",
	rest: "pranayama.rest",
};

// ── Audio envelope helpers ──────────────────────────────────────────────────
const AUDIO = {
	// Soft ocean-like noise burst
	ocean: { type: "noise", freq: 0, gain: 0.06, attack: 0.4, release: 0.6 },
	// Gentle sine bell
	bell: { type: "sine", freq: 528, gain: 0.10, attack: 0.01, release: 0.8 },
	// Soft click
	click: { type: "sine", freq: 880, gain: 0.08, attack: 0.005, release: 0.08 },
	// Continuous low hum (for bhramari exhale)
	hum: { type: "sine", freq: 220, gain: 0.07, attack: 0.3, release: 0.5, sustain: true },
	// Neutral mid-range tone
	tone: { type: "sine", freq: 396, gain: 0.08, attack: 0.05, release: 0.4 },
	// Short energetic pulse
	pulse: { type: "square", freq: 440, gain: 0.06, attack: 0.005, release: 0.06 },
	// Silence
	none: null,
};

// ── Profiles ────────────────────────────────────────────────────────────────
const PROFILES = {
	ujjayi: {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseDuration: 5,
		animation: {
			inhale: { scale: 1.25, ease: [0.25, 0.1, 0.25, 1.0] },
			exhale: { scale: 0.8, ease: [0.42, 0, 0.58, 1.0] },
		},
		visual: {
			circleStyle: "wave",
			palette: "warm",
			phaseEmphasis: "exhale",
		},
		audio: {
			inhale: AUDIO.ocean,
			exhale: AUDIO.ocean,
			phaseChange: AUDIO.bell,
		},
		haptic: { inhale: 20, exhale: 0, phaseChange: 30 },
		stimulation: "low",
		safety: { maxCyclesBeginner: 15 },
		pauseBetweenCycles: 0,
	},

	"nadi shodhana": {
		phaseOrder: ["inhale", "hold", "exhale"],
		defaultRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 0 },
		baseDuration: 4,
		animation: {
			inhale: { scale: 1.2, ease: [0.33, 0, 0.67, 1] },
			hold: { scale: 1.2, ease: "linear" },
			exhale: { scale: 0.85, ease: [0.33, 0, 0.67, 1] },
		},
		visual: {
			circleStyle: "nostril",
			palette: "balanced",
			phaseEmphasis: null,
		},
		audio: {
			inhale: AUDIO.tone,
			hold: AUDIO.none,
			exhale: AUDIO.tone,
			phaseChange: AUDIO.click,
		},
		haptic: { inhale: 15, hold: 0, exhale: 15, phaseChange: 25 },
		stimulation: "low",
		nostrilAlternation: true,
		safety: { maxCyclesBeginner: 12 },
		pauseBetweenCycles: 2,
	},

	kapalabhati: {
		phaseOrder: ["exhale", "inhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseDuration: 0.5, // fast pumps
		animation: {
			exhale: { scale: 0.7, ease: [0.5, 0, 1, 1] },
			inhale: { scale: 1.05, ease: [0, 0, 0.5, 1] },
		},
		visual: {
			circleStyle: "pulse",
			palette: "energizing",
			phaseEmphasis: "exhale",
		},
		audio: {
			exhale: AUDIO.pulse,
			inhale: AUDIO.none,
			phaseChange: AUDIO.none,
			roundChange: AUDIO.bell,
		},
		haptic: { exhale: 15, inhale: 0, roundChange: 60 },
		stimulation: "high",
		countBased: true,
		roundBased: true,
		safety: {
			maxCyclesBeginner: 30,
			maxRoundsBeginner: 2,
			showWarning: true,
			warningKey: "pranayama.safety_kapalabhati",
		},
		pauseBetweenCycles: 3,
	},

	bhastrika: {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseDuration: 1.5,
		animation: {
			inhale: { scale: 1.3, ease: [0.5, 0, 1, 1] },
			exhale: { scale: 0.75, ease: [0.5, 0, 1, 1] },
		},
		visual: {
			circleStyle: "pulse",
			palette: "energizing",
			phaseEmphasis: null,
		},
		audio: {
			inhale: AUDIO.pulse,
			exhale: AUDIO.pulse,
			phaseChange: AUDIO.none,
			roundChange: AUDIO.bell,
		},
		haptic: { inhale: 10, exhale: 10, roundChange: 60 },
		stimulation: "high",
		roundBased: true,
		safety: {
			maxCyclesBeginner: 20,
			maxRoundsBeginner: 2,
			showWarning: true,
			warningKey: "pranayama.safety_bhastrika",
		},
		pauseBetweenCycles: 4,
	},

	bhramari: {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseDuration: 5,
		animation: {
			inhale: { scale: 1.15, ease: [0.33, 0, 0.67, 1] },
			exhale: { scale: 0.9, ease: [0.25, 0.1, 0.25, 1.0] },
		},
		visual: {
			circleStyle: "wave",
			palette: "calming",
			phaseEmphasis: "exhale",
		},
		audio: {
			inhale: AUDIO.none,
			exhale: AUDIO.hum,
			phaseChange: AUDIO.none,
		},
		haptic: { inhale: 0, exhale: 0, phaseChange: 0 },
		stimulation: "low",
		safety: { maxCyclesBeginner: 12 },
		pauseBetweenCycles: 2,
	},

	sitali: {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
		baseDuration: 5,
		animation: {
			inhale: { scale: 1.2, ease: [0.2, 0, 0.4, 1] },
			exhale: { scale: 0.85, ease: [0.2, 0, 0.4, 1] },
		},
		visual: {
			circleStyle: "wave",
			palette: "cooling",
			phaseEmphasis: "inhale",
		},
		audio: {
			inhale: AUDIO.ocean,
			exhale: AUDIO.none,
			phaseChange: AUDIO.bell,
		},
		haptic: { inhale: 10, exhale: 0, phaseChange: 20 },
		stimulation: "low",
		safety: { maxCyclesBeginner: 10 },
		pauseBetweenCycles: 0,
	},

	// ── Additional seeded techniques ────────────────────────────────────────
	"surya bhedana": {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseDuration: 5,
		animation: {
			inhale: { scale: 1.2, ease: [0.33, 0, 0.67, 1] },
			exhale: { scale: 0.85, ease: [0.33, 0, 0.67, 1] },
		},
		visual: {
			circleStyle: "nostril",
			palette: "warm",
			phaseEmphasis: "inhale",
		},
		audio: {
			inhale: AUDIO.tone,
			exhale: AUDIO.tone,
			phaseChange: AUDIO.click,
		},
		haptic: { inhale: 15, exhale: 15, phaseChange: 25 },
		stimulation: "medium",
		nostrilAlternation: true,
		safety: { maxCyclesBeginner: 10 },
		pauseBetweenCycles: 2,
	},

	"sama vritti": {
		phaseOrder: ["inhale", "exhale"],
		defaultRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
		baseDuration: 4,
		animation: {
			inhale: { scale: 1.2, ease: [0.42, 0, 0.58, 1] },
			exhale: { scale: 0.85, ease: [0.42, 0, 0.58, 1] },
		},
		visual: {
			circleStyle: "circle",
			palette: "balanced",
			phaseEmphasis: null,
		},
		audio: {
			inhale: AUDIO.tone,
			exhale: AUDIO.tone,
			phaseChange: AUDIO.bell,
		},
		haptic: { inhale: 15, exhale: 15, phaseChange: 25 },
		stimulation: "low",
		safety: { maxCyclesBeginner: 15 },
		pauseBetweenCycles: 0,
	},

	"agni prasana": {
		phaseOrder: ["inhale", "hold", "exhale", "holdAfterExhale"],
		defaultRatio: { inhale: 1, hold: 1, exhale: 2, holdAfterExhale: 1 },
		baseDuration: 4,
		animation: {
			inhale: { scale: 1.25, ease: [0.33, 0, 0.67, 1] },
			hold: { scale: 1.25, ease: "linear" },
			exhale: { scale: 0.8, ease: [0.42, 0, 0.58, 1] },
			holdAfterExhale: { scale: 0.8, ease: "linear" },
		},
		visual: {
			circleStyle: "circle",
			palette: "energizing",
			phaseEmphasis: "hold",
		},
		audio: {
			inhale: AUDIO.tone,
			hold: AUDIO.none,
			exhale: AUDIO.tone,
			holdAfterExhale: AUDIO.none,
			phaseChange: AUDIO.click,
		},
		haptic: { inhale: 15, hold: 10, exhale: 15, holdAfterExhale: 10, phaseChange: 30 },
		stimulation: "medium",
		safety: { maxCyclesBeginner: 8 },
		pauseBetweenCycles: 3,
	},
};

// ── Default profile (for unknown techniques) ────────────────────────────────
const DEFAULT_PROFILE = {
	phaseOrder: ["inhale", "hold", "exhale", "holdAfterExhale"],
	defaultRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
	baseDuration: 4,
	animation: {
		inhale: { scale: 1.2, ease: [0.33, 0, 0.67, 1] },
		hold: { scale: 1.2, ease: "linear" },
		exhale: { scale: 0.85, ease: [0.42, 0, 0.58, 1] },
		holdAfterExhale: { scale: 0.85, ease: "linear" },
	},
	visual: {
		circleStyle: "circle",
		palette: "balanced",
		phaseEmphasis: null,
	},
	audio: {
		inhale: AUDIO.tone,
		hold: AUDIO.none,
		exhale: AUDIO.tone,
		holdAfterExhale: AUDIO.none,
		phaseChange: AUDIO.bell,
	},
	haptic: { inhale: 15, hold: 0, exhale: 15, holdAfterExhale: 0, phaseChange: 25 },
	stimulation: "low",
	safety: { maxCyclesBeginner: 15 },
	pauseBetweenCycles: 0,
};

// ── Low-stimulation overrides ───────────────────────────────────────────────
export const LOW_STIM_OVERRIDES = {
	animation: {
		// Reduce all scales towards 1.0
		scaleMultiplier: 0.4, // scale = 1 + (original - 1) * multiplier
	},
	audio: {
		gainMultiplier: 0.4,
		// Disable pulse/square waveforms → fallback to sine
		forceWaveform: "sine",
	},
	haptic: {
		enabled: false,
	},
};

/**
 * Resolve the technique profile for a given pattern.
 * @param {object} pattern - Backend BreathingPattern object
 * @returns {object} Merged profile with backend data taking precedence
 */
function resolveProfile(base, ratio, baseDur) {
	const phaseDurations = {
		inhale: (ratio.inhale || 0) * baseDur,
		hold: (ratio.hold || 0) * baseDur,
		exhale: (ratio.exhale || 0) * baseDur,
		holdAfterExhale: (ratio.holdAfterExhale || 0) * baseDur,
	};
	// Build activePhases from the canonical order, including any phase whose
	// ratio produces a non-zero duration — even if the profile's phaseOrder
	// omits it. This ensures that a backend ratio like 1:1:1 correctly
	// activates the hold phase even for techniques that default to 0 hold.
	const activePhases = PHASE_KEYS.filter((k) => phaseDurations[k] > 0);

	return {
		...base,
		ratio,
		baseDuration: baseDur,
		phaseDurations,
		activePhases,
		totalCycleDuration: activePhases.reduce(
			(sum, k) => sum + phaseDurations[k],
			0,
		),
	};
}

export function getProfile(pattern) {
	if (!pattern) return resolveProfile(DEFAULT_PROFILE, DEFAULT_PROFILE.defaultRatio, DEFAULT_PROFILE.baseDuration);
	const key = (pattern.romanizationName || "").trim().toLowerCase();
	const base = PROFILES[key] || DEFAULT_PROFILE;

	const ratio = hasUsableRatio(pattern.patternRatio)
		? pattern.patternRatio
		: base.defaultRatio;
	const baseDur = pattern.baseBreathDuration || base.baseDuration;

	return resolveProfile(base, ratio, baseDur);
}

function hasUsableRatio(ratio) {
	if (!ratio || typeof ratio !== "object") return false;
	return (
		(Number(ratio.inhale) || 0) +
		(Number(ratio.hold) || 0) +
		(Number(ratio.exhale) || 0) +
		(Number(ratio.holdAfterExhale) || 0) > 0
	);
}

/**
 * Apply low-stimulation overrides to a resolved profile.
 */
export function applyLowStim(profile) {
	const mult = LOW_STIM_OVERRIDES.animation.scaleMultiplier;
	const animation = {};
	for (const [phase, anim] of Object.entries(profile.animation)) {
		animation[phase] = {
			...anim,
			scale: 1 + (anim.scale - 1) * mult,
		};
	}

	return {
		...profile,
		animation,
		haptic: Object.fromEntries(
			Object.entries(profile.haptic).map(([k]) => [k, 0]),
		),
	};
}

export default PROFILES;

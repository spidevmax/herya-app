export const API_BASE =
	import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const VK_FAMILIES = [
	{
		key: "tadasana",
		label: "Tadasana",
		emoji: null,
		color: "var(--color-family-tadasana)",
	},
	{
		key: "standing_asymmetric",
		label: "Standing Asymmetric",
		emoji: null,
		color: "var(--color-family-standing-asymmetric)",
	},
	{
		key: "standing_symmetric",
		label: "Standing Symmetric",
		emoji: null,
		color: "var(--color-family-standing-symmetric)",
	},
	{
		key: "one_leg_standing",
		label: "One Leg Standing",
		emoji: null,
		color: "var(--color-family-one-leg-standing)",
	},
	{ key: "seated", label: "Seated", emoji: null, color: "var(--color-family-seated)" },
	{ key: "supine", label: "Supine", emoji: null, color: "var(--color-family-supine)" },
	{ key: "prone", label: "Prone", emoji: null, color: "var(--color-family-prone)" },
	{ key: "inverted", label: "Inverted", emoji: null, color: "var(--color-family-inverted)" },
	{
		key: "meditative",
		label: "Meditative",
		emoji: null,
		color: "var(--color-family-meditative)",
	},
	{ key: "bow_sequence", label: "Bow", emoji: null, color: "var(--color-family-bow-sequence)" },
	{
		key: "triangle_sequence",
		label: "Triangle",
		emoji: null,
		color: "var(--color-family-triangle-sequence)",
	},
	{
		key: "sun_salutation",
		label: "Sun Salutation",
		emoji: null,
		color: "var(--color-family-sun-salutation)",
	},
	{
		key: "vajrasana_variations",
		label: "Vajrasana",
		emoji: null,
		color: "var(--color-family-vajrasana-variations)",
	},
	{
		key: "lotus_variations",
		label: "Lotus",
		emoji: null,
		color: "var(--color-family-lotus-variations)",
	},
];

export const VK_FAMILY_MAP = Object.fromEntries(
	VK_FAMILIES.map((f) => [f.key, f]),
);

export const LEVEL_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };

export const MOOD_OPTIONS = [
	"calm",
	"anxious",
	"energized",
	"tired",
	"focused",
	"stressed",
	"happy",
	"sad",
	"grounded",
	"restless",
	"peaceful",
	"overwhelmed",
	"motivated",
	"discouraged",
	"scattered",
	"irritated",
];

export const MOOD_AFTER_OPTIONS = [
	...MOOD_OPTIONS,
	"renewed",
	"centered",
	"light",
	"clear",
];

export const MOOD_COLORS = {
	calm: "var(--color-mood-calm)",
	anxious: "var(--color-mood-anxious)",
	energized: "var(--color-mood-energized)",
	tired: "var(--color-mood-tired)",
	focused: "var(--color-mood-focused)",
	stressed: "var(--color-mood-stressed)",
	happy: "var(--color-mood-happy)",
	sad: "var(--color-mood-sad)",
	grounded: "var(--color-mood-grounded)",
	restless: "var(--color-mood-restless)",
	peaceful: "var(--color-mood-peaceful)",
	overwhelmed: "var(--color-mood-overwhelmed)",
	motivated: "var(--color-mood-motivated)",
	discouraged: "var(--color-mood-discouraged)",
	renewed: "var(--color-mood-renewed)",
	centered: "var(--color-mood-centered)",
	light: "var(--color-mood-light)",
	clear: "var(--color-mood-clear)",
	grateful: "var(--color-mood-grateful)",
};

export const GARDEN_MOOD_ORDER = [
	"calm",
	"centered",
	"peaceful",
	"grounded",
	"energized",
	"motivated",
	"focused",
	"light",
	"clear",
	"tired",
	"stressed",
	"anxious",
	"overwhelmed",
	"restless",
	"sad",
	"discouraged",
	"happy",
	"grateful",
];

export const SESSION_TYPES = [
	{ value: "vk_sequence", label: "VK Sequence", icon: null },
	{ value: "pranayama", label: "Pranayama", icon: null },
	{ value: "meditation", label: "Meditation", icon: null },
	{ value: "complete_practice", label: "Complete Practice", icon: null },
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const PRANAYAMA_PATTERNS = {
	"4-4-4-4": { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: "Box Breath" },
	"4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: "4-7-8" },
	"4-0-4": { inhale: 4, hold1: 0, exhale: 4, hold2: 0, name: "Equal Breath" },
	"4-4-6": { inhale: 4, hold1: 4, exhale: 6, hold2: 0, name: "Relaxing" },
};

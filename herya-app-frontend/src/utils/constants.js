const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const VK_FAMILIES = [
	{
		id: 1,
		labelKey: "constants.family_tadasana",
		label: "Tadasana",
		emoji: "🧍",
		color: "var(--color-family-tadasana)",
	},
	{
		id: 2,
		labelKey: "constants.family_standing_asymmetric",
		label: "Standing Asymmetric",
		emoji: "🧍",
		color: "var(--color-family-standing-asymmetric)",
	},
	{
		id: 3,
		labelKey: "constants.family_standing_symmetric",
		label: "Standing Symmetric",
		emoji: "🧍",
		color: "var(--color-family-standing-symmetric)",
	},
	{
		id: 4,
		labelKey: "constants.family_one_leg_standing",
		label: "One Leg Standing",
		emoji: "🧍",
		color: "var(--color-family-one-leg-standing)",
	},
	{
		id: 5,
		labelKey: "constants.family_seated",
		label: "Seated",
		emoji: "🧍",
		color: "var(--color-family-seated)",
	},
	{
		id: 6,
		labelKey: "constants.family_supine",
		label: "Supine",
		emoji: "🧍",
		color: "var(--color-family-supine)",
	},
	{
		id: 7,
		labelKey: "constants.family_prone",
		label: "Prone",
		emoji: "🧍",
		color: "var(--color-family-prone)",
	},
	{
		id: 8,
		labelKey: "constants.family_inverted",
		label: "Inverted",
		emoji: "🧍",
		color: "var(--color-family-inverted)",
	},
	{
		id: 9,
		labelKey: "constants.family_meditative",
		label: "Meditative",
		emoji: "🧍",
		color: "var(--color-family-meditative)",
	},
	{
		id: 10,
		labelKey: "constants.family_bow_sequence",
		label: "Bow",
		emoji: "🧍",
		color: "var(--color-family-bow-sequence)",
	},
	{
		id: 11,
		labelKey: "constants.family_triangle_sequence",
		label: "Triangle",
		emoji: "🧍",
		color: "var(--color-family-triangle-sequence)",
	},
	{
		id: 12,
		labelKey: "constants.family_sun_salutation",
		label: "Sun Salutation",
		emoji: "🧍",
		color: "var(--color-family-sun-salutation)",
	},
	{
		id: 13,
		labelKey: "constants.family_vajrasana_variations",
		label: "Vajrasana",
		emoji: "🧍",
		color: "var(--color-family-vajrasana-variations)",
	},
	{
		id: 14,
		labelKey: "constants.family_lotus_variations",
		label: "Lotus",
		emoji: "🧍",
		color: "var(--color-family-lotus-variations)",
	},
];

const VK_FAMILY_MAP = Object.fromEntries(VK_FAMILIES.map((f) => [f.id, f]));

const LEVEL_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };

const LEVEL_LABEL_KEYS = {
	1: "constants.level_1",
	2: "constants.level_2",
	3: "constants.level_3",
};

const MOOD_OPTIONS = [
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

const MOOD_AFTER_OPTIONS = [
	...MOOD_OPTIONS,
	"renewed",
	"centered",
	"light",
	"clear",
];

const MOOD_COLORS = {
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

const GARDEN_MOOD_ORDER = [
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

const SESSION_TYPES = [
	{
		value: "vk_sequence",
		labelKey: "constants.session_type_vk_sequence",
		label: "VK Sequence",
		icon: null,
	},
	{
		value: "pranayama",
		labelKey: "constants.session_type_pranayama",
		label: "Pranayama",
		icon: null,
	},
	{
		value: "meditation",
		labelKey: "constants.session_type_meditation",
		label: "Meditation",
		icon: null,
	},
	{
		value: "complete_practice",
		labelKey: "constants.session_type_complete_practice",
		label: "Complete Practice",
		icon: null,
	},
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAY_LABEL_KEYS = [
	"constants.day_sun",
	"constants.day_mon",
	"constants.day_tue",
	"constants.day_wed",
	"constants.day_thu",
	"constants.day_fri",
	"constants.day_sat",
];

const PRANAYAMA_PATTERNS = {
	"4-4-4-4": {
		inhale: 4,
		hold1: 4,
		exhale: 4,
		hold2: 4,
		nameKey: "constants.pranayama_box_breath",
		name: "Box Breath",
	},
	"4-7-8": {
		inhale: 4,
		hold1: 7,
		exhale: 8,
		hold2: 0,
		nameKey: "constants.pranayama_4_7_8",
		name: "4-7-8",
	},
	"4-0-4": {
		inhale: 4,
		hold1: 0,
		exhale: 4,
		hold2: 0,
		nameKey: "constants.pranayama_equal_breath",
		name: "Equal Breath",
	},
	"4-4-6": {
		inhale: 4,
		hold1: 4,
		exhale: 6,
		hold2: 0,
		nameKey: "constants.pranayama_relaxing",
		name: "Relaxing",
	},
};

export {
	API_BASE,
	DAY_LABEL_KEYS,
	DAY_LABELS,
	GARDEN_MOOD_ORDER,
	LEVEL_LABEL_KEYS,
	LEVEL_LABELS,
	MOOD_AFTER_OPTIONS,
	MOOD_COLORS,
	MOOD_OPTIONS,
	PRANAYAMA_PATTERNS,
	SESSION_TYPES,
	VK_FAMILIES,
	VK_FAMILY_MAP,
};

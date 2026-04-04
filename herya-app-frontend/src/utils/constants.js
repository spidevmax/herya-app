export const API_BASE =
	import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const VK_FAMILIES = [
	{ key: "tadasana", label: "Tadasana", emoji: null, color: "#2458B8" },
	{
		key: "standing_asymmetric",
		label: "Standing Asymmetric",
		emoji: null,
		color: "#D84A3A",
	},
	{
		key: "standing_symmetric",
		label: "Standing Symmetric",
		emoji: null,
		color: "#E6A328",
	},
	{
		key: "one_leg_standing",
		label: "One Leg Standing",
		emoji: null,
		color: "#3C73CE",
	},
	{ key: "seated", label: "Seated", emoji: null, color: "#1F8A5B" },
	{ key: "supine", label: "Supine", emoji: null, color: "#2F7EA8" },
	{ key: "prone", label: "Prone", emoji: null, color: "#C96B2C" },
	{ key: "inverted", label: "Inverted", emoji: null, color: "#1C4E9F" },
	{ key: "meditative", label: "Meditative", emoji: null, color: "#3E9A6D" },
	{ key: "bow_sequence", label: "Bow", emoji: null, color: "#CB7A1B" },
	{
		key: "triangle_sequence",
		label: "Triangle",
		emoji: null,
		color: "#2A9D6F",
	},
	{
		key: "sun_salutation",
		label: "Sun Salutation",
		emoji: null,
		color: "#E5AE38",
	},
	{
		key: "vajrasana_variations",
		label: "Vajrasana",
		emoji: null,
		color: "#C84B3A",
	},
	{ key: "lotus_variations", label: "Lotus", emoji: null, color: "#4F96B8" },
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
];

export const MOOD_AFTER_OPTIONS = [
	...MOOD_OPTIONS,
	"renewed",
	"centered",
	"light",
	"clear",
];

export const MOOD_COLORS = {
	calm: "#74C69D",
	anxious: "#FF6B6B",
	energized: "#FFB347",
	tired: "#9CA3AF",
	focused: "#4A72FF",
	stressed: "#EF476F",
	happy: "#FFD166",
	sad: "#48CAE4",
	grounded: "#5DB075",
	restless: "#F4845F",
	peaceful: "#A8DADC",
	overwhelmed: "#C77DFF",
	motivated: "#06D6A0",
	discouraged: "#6B7280",
	renewed: "#7B9FFF",
	centered: "#74C69D",
	light: "#FFC97A",
	clear: "#48CAE4",
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

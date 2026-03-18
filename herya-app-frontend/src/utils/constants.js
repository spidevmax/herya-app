export const API_BASE =
	import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

export const VK_FAMILIES = [
	{ key: "tadasana", label: "Tadasana", emoji: "🏔️", color: "#4A72FF" },
	{
		key: "standing_asymmetric",
		label: "Standing Asymmetric",
		emoji: "🌊",
		color: "#FF6B6B",
	},
	{
		key: "standing_symmetric",
		label: "Standing Symmetric",
		emoji: "⚖️",
		color: "#FFB347",
	},
	{
		key: "one_leg_standing",
		label: "One Leg Standing",
		emoji: "🦩",
		color: "#C77DFF",
	},
	{ key: "seated", label: "Seated", emoji: "🪷", color: "#5DB075" },
	{ key: "supine", label: "Supine", emoji: "🌙", color: "#48CAE4" },
	{ key: "prone", label: "Prone", emoji: "🐍", color: "#F4845F" },
	{ key: "inverted", label: "Inverted", emoji: "🔄", color: "#9B5DE5" },
	{ key: "meditative", label: "Meditative", emoji: "🧘", color: "#74C69D" },
	{ key: "bow_sequence", label: "Bow", emoji: "🏹", color: "#F77F00" },
	{
		key: "triangle_sequence",
		label: "Triangle",
		emoji: "🔺",
		color: "#06D6A0",
	},
	{
		key: "sun_salutation",
		label: "Sun Salutation",
		emoji: "☀️",
		color: "#FFD166",
	},
	{
		key: "vajrasana_variations",
		label: "Vajrasana",
		emoji: "💎",
		color: "#EF476F",
	},
	{ key: "lotus_variations", label: "Lotus", emoji: "🌸", color: "#A8DADC" },
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

export const SESSION_TYPES = [
	{ value: "vk_sequence", label: "VK Sequence", icon: "🧘" },
	{ value: "pranayama", label: "Pranayama", icon: "💨" },
	{ value: "meditation", label: "Meditation", icon: "🌿" },
	{ value: "complete_practice", label: "Complete Practice", icon: "⭐" },
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const PRANAYAMA_PATTERNS = {
	"4-4-4-4": { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: "Box Breath" },
	"4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: "4-7-8" },
	"4-0-4": { inhale: 4, hold1: 0, exhale: 4, hold2: 0, name: "Equal Breath" },
	"4-4-6": { inhale: 4, hold1: 4, exhale: 6, hold2: 0, name: "Relaxing" },
};

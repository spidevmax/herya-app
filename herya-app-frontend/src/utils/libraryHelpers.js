/**
 * Shared utilities for Library, SequenceDetail, PoseDetail, BreathingDetail.
 */

// ── Difficulty color map (shared between PoseDetail & BreathingDetail) ───────
export const DIFF_COLORS = {
	beginner: "var(--color-success)",
	intermediate: "var(--color-warning)",
	advanced: "var(--color-danger)",
};

// ── Safe opacity via color-mix ──────────────────────────────────────────────
// Replaces the broken `${color}18` hex-append pattern that fails with CSS vars.
export const colorMix = (color, pct) =>
	`color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ── Translate with fallback (reusable across all pages) ─────────────────────
export const translateWithFallback = (t, key, fallback) => {
	const value = t(key);
	return value === key ? (fallback ?? key) : value;
};

// ── Palettes ────────────────────────────────────────────────────────────────
const buildPalette = (color) => ({
	bg: `var(--color-tone-${paletteToken(color)}-bg)`,
	border: color,
	statBg: colorMix(color, 16),
});

const paletteToken = (cssVar) => {
	if (cssVar.includes("success")) return "success";
	if (cssVar.includes("warning")) return "warning";
	if (cssVar.includes("danger")) return "danger";
	if (cssVar.includes("info")) return "info";
	return "primary";
};

export const PALETTE = {
	beginner: {
		bg: "var(--color-tone-success-bg)",
		border: "var(--color-success)",
		statBg: colorMix("var(--color-success)", 16),
	},
	intermediate: {
		bg: "var(--color-tone-warning-bg)",
		border: "var(--color-warning)",
		statBg: colorMix("var(--color-warning)", 16),
	},
	advanced: {
		bg: "var(--color-tone-danger-bg)",
		border: "var(--color-danger)",
		statBg: colorMix("var(--color-danger)", 16),
	},
	default: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-primary)",
		statBg: colorMix("var(--color-primary)", 16),
	},
};

export const BREATHING_PALETTE = {
	calming: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-info)",
		statBg: colorMix("var(--color-info)", 16),
	},
	energizing: {
		bg: "var(--color-tone-warning-bg)",
		border: "var(--color-warning)",
		statBg: colorMix("var(--color-warning)", 16),
	},
	balancing: {
		bg: "var(--color-tone-primary-bg)",
		border: "var(--color-primary)",
		statBg: colorMix("var(--color-primary)", 16),
	},
	cooling: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-info)",
		statBg: colorMix("var(--color-info)", 16),
	},
	heating: {
		bg: "var(--color-tone-danger-bg)",
		border: "var(--color-danger)",
		statBg: colorMix("var(--color-danger)", 16),
	},
	default: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-primary)",
		statBg: colorMix("var(--color-primary)", 16),
	},
};

// ── Palette lookup ──────────────────────────────────────────────────────────
export const getPalette = (item, type) => {
	if (type === "breathing") {
		return BREATHING_PALETTE[item.energyEffect] ?? BREATHING_PALETTE.default;
	}
	return PALETTE[item.difficulty] ?? PALETTE.default;
};

// ── Localized field helpers ─────────────────────────────────────────────────
// Pick the correct language variant of a field from API data.
// Usage: localized(item, "name", lang) → item.nameEs || item.name (when lang=es)
export const localized = (item, field, lang) => {
	if (!item) return undefined;
	if (lang === "es") {
		const esKey = `${field}Es`;
		if (item[esKey]) return item[esKey];
	}
	return item[field];
};

// For the special case of sequence/pose display name:
// spanishName / englishName / name / romanizationName
export const localizedName = (item, lang) => {
	if (!item) return "";
	if (lang === "es" && item.spanishName) return item.spanishName;
	if (lang === "es" && item.nameEs) return item.nameEs;
	return item.englishName || item.name || item.romanizationName || "";
};

// For arrays (benefits, contraindications, commonMistakes):
export const localizedArray = (item, field, lang) => {
	if (!item) return [];
	if (lang === "es") {
		const esKey = `${field}Es`;
		if (Array.isArray(item[esKey]) && item[esKey].length > 0) return item[esKey];
	}
	return Array.isArray(item[field]) ? item[field] : [];
};

// ── Card helpers ────────────────────────────────────────────────────────────
export const getMonogram = (title) =>
	String(title || "")
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

export const getCardTitle = (item, fallbackItemLabel, lang) => {
	if (lang === "es") {
		return item.spanishName || item.nameEs || item.englishName || item.name || item.romanizationName || fallbackItemLabel;
	}
	return item.englishName || item.name || item.romanizationName || fallbackItemLabel;
};

export const getCardSubtitle = (item) =>
	item.romanizationName || item.sanskritName || item.romanizedName || "";

export const getCardType = (item, fallbackType) =>
	item.__kind || fallbackType;

export const getItemId = (item) =>
	item._id ||
	item.id ||
	item.slug ||
	item.englishName ||
	item.name ||
	item.title;

export const getTypeLabel = (type, t) => {
	if (type === "sequences")
		return t("library.card_type_sequence", "VK Sequence");
	if (type === "poses") return t("library.card_type_pose", "Asana");
	if (type === "breathing")
		return t("library.card_type_breathing", "Pranayama");
	return t("library.card_type_default", "Library");
};

export const getSequencePoseCount = (item) => {
	if (Array.isArray(item.keyPoses)) return item.keyPoses.length;
	if (Array.isArray(item.structure?.corePoses))
		return item.structure.corePoses.length;
	return null;
};

// ── Search ──────────────────────────────────────────────────────────────────
export const collectSearchText = (item) =>
	[
		item.englishName,
		item.spanishName,
		item.name,
		item.nameEs,
		item.sanskritName,
		item.romanizationName,
		item.romanizedName,
		item.description,
		item.descriptionEs,
		item.family,
		item.energyEffect,
		item.difficulty,
		item.level,
	]
		.filter(Boolean)
		.join(" ");

// ── Filter / sort helpers ───────────────────────────────────────────────────
export const INTENSITY_DIFFICULTY_ORDER = {
	gentle: ["beginner", "intermediate", "advanced"],
	moderate: ["intermediate", "beginner", "advanced"],
	vigorous: ["advanced", "intermediate", "beginner"],
};

export const TIME_EFFECT_ORDER = {
	morning: ["energizing", "balancing", "calming", "cooling", "heating"],
	afternoon: ["balancing", "energizing", "calming", "cooling", "heating"],
	evening: ["calming", "balancing", "cooling", "energizing", "heating"],
	anytime: ["balancing", "calming", "energizing", "cooling", "heating"],
};

export const getPreferredOrderIndex = (value, order, fallbackIndex = 99) => {
	if (!value) return fallbackIndex;
	const index = order.indexOf(String(value));
	return index === -1 ? fallbackIndex : index;
};

export const filterByQuery = (item, query) => {
	if (query.length < 2) return true;
	return collectSearchText(item).toLowerCase().includes(query);
};

export const filterByDifficulty = (item, difficultyFilter, type) => {
	if (difficultyFilter === "all") return true;
	if (type !== "sequences" && type !== "poses") return true;
	return item.difficulty === difficultyFilter;
};

export const filterByEffect = (item, effectFilter, type) => {
	if (effectFilter === "all") return true;
	if (type !== "breathing") return true;
	return item.energyEffect === effectFilter;
};

export const sortItems = (items, fallbackType, difficultyOrder, effectOrder) =>
	[...items].sort((a, b) => {
		const aType = getCardType(a, fallbackType);
		const bType = getCardType(b, fallbackType);
		const aDifficultyRank =
			aType === "sequences" || aType === "poses"
				? getPreferredOrderIndex(a.difficulty, difficultyOrder)
				: 99;
		const bDifficultyRank =
			bType === "sequences" || bType === "poses"
				? getPreferredOrderIndex(b.difficulty, difficultyOrder)
				: 99;
		if (aDifficultyRank !== bDifficultyRank)
			return aDifficultyRank - bDifficultyRank;

		const aEffectRank =
			aType === "breathing"
				? getPreferredOrderIndex(a.energyEffect, effectOrder)
				: 99;
		const bEffectRank =
			bType === "breathing"
				? getPreferredOrderIndex(b.energyEffect, effectOrder)
				: 99;
		if (aEffectRank !== bEffectRank) return aEffectRank - bEffectRank;

		const aTitle = getCardTitle(a, "").toLowerCase();
		const bTitle = getCardTitle(b, "").toLowerCase();
		return aTitle.localeCompare(bTitle);
	});

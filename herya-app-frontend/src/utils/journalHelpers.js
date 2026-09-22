import { MOOD_COLORS } from "@/utils/constants";

/**
 * Resolve the unique ID for a journal entry regardless of shape.
 */
export const resolveEntryId = (entry) => {
	if (!entry) return null;
	const raw = entry._id ?? entry.id ?? entry.session;
	if (!raw) return null;
	if (typeof raw === "string") return raw;
	if (typeof raw === "number") return String(raw);
	if (typeof raw === "object") return String(raw._id ?? raw.id ?? "");
	return null;
};

/**
 * Extract practice type from an entry (populated or flat).
 */
export const getPracticeType = (entry) =>
	entry?.session?.sessionType || entry?.sessionType || null;

/**
 * Build deduplicated key tokens for a mood array (for React keys).
 */
export const toMoodTokens = (moods, prefix) => {
	const seen = {};
	return moods.map((mood) => {
		seen[mood] = (seen[mood] ?? 0) + 1;
		return { mood, key: `${prefix}-${mood}-${seen[mood]}` };
	});
};

/**
 * Translate a key with a fallback when the key itself is returned.
 */
export const translateWithFallback = (t, key, fallback) => {
	const translated = t(key);
	return translated === key ? (fallback ?? key) : translated;
};

/**
 * Translate a mood key via the session.moods namespace.
 */
export const translateMoodLabel = (t, mood) =>
	translateWithFallback(t, `session.moods.${mood}`, mood);

export const getMoodColorStyle = (mood) => {
	const raw = MOOD_COLORS[mood];
	if (!raw) {
		return {
			backgroundColor: "var(--paper-raised)",
			color: "var(--ink)",
			borderColor: "var(--ink)",
		};
	}
	/*
	 * El color del animo va en el RELLENO, no en el texto. Antes el texto usaba
	 * ese mismo color pastel sobre un fondo del 10% del mismo color: quedaba
	 * pastel sobre casi blanco, con un contraste de 1.4:1 cuando el minimo
	 * legible es 4.5:1.
	 *
	 * Al 30% el tinte se distingue y el texto en --ink se lee: medido sobre los
	 * 19 animos en los dos temas, el peor caso da 6.5:1.
	 */
	return {
		backgroundColor: `color-mix(in srgb, ${raw} 30%, transparent)`,
		color: "var(--ink)",
		borderColor: "var(--ink)",
	};
};

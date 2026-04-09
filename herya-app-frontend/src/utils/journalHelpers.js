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
			backgroundColor: "var(--color-surface)",
			color: "var(--color-text-secondary)",
			borderColor: "var(--color-border-soft)",
		};
	}
	return {
		backgroundColor: `color-mix(in srgb, ${raw} 10%, transparent)`,
		color: raw,
		borderColor: `color-mix(in srgb, ${raw} 22%, var(--color-border-soft))`,
	};
};

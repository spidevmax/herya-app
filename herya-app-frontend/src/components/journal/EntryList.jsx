import { MOOD_COLORS } from "@/utils/constants";
import { format } from "@/utils/helpers";
import { useLanguage } from "@/context/LanguageContext";

const toMoodTokens = (moods, prefix) => {
	const seen = {};
	return moods.map((mood) => {
		seen[mood] = (seen[mood] ?? 0) + 1;
		return {
			mood,
			key: `${prefix}-${mood}-${seen[mood]}`,
		};
	});
};

const EntryCard = ({ entry, onSelect }) => {
	const { t, lang } = useLanguage();

	const entryId = entry?._id || entry?.id || entry?.session;
	const practiceType = entry?.session?.sessionType || entry?.sessionType;
	const moods = entry.moodAfter || entry.moodBefore || [];
	const moodTokens = toMoodTokens(moods.slice(0, 2), `entry-${entryId}`);
	const created = format.date(entry.date || entry.createdAt, lang);

	const translateMoodLabel = (mood) => {
		const key = `session.moods.${mood}`;
		const translated = t(key);
		return translated === key ? mood : translated;
	};

	const translateWithFallback = (key, fallback) => {
		const translated = t(key);
		return translated === key ? fallback : translated;
	};

	return (
		<button
			type="button"
			onClick={() => onSelect(entry)}
			className="w-full rounded-2xl p-3.5 text-left transition duration-200 hover:shadow-md hover:-translate-y-[1px]"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<div className="flex items-start justify-between gap-2 mb-2.5">
				<div className="min-w-0">
					<p
						className="font-display text-[24px] font-semibold leading-tight"
						style={{ color: "var(--color-text-primary)" }}
					>
						{created}
					</p>
					{practiceType && (
						<p
							className="text-sm mt-0.5 truncate"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{translateWithFallback(
								`journal.practice_types.${practiceType}`,
								practiceType,
							)}
						</p>
					)}
				</div>
				<div className="text-right shrink-0">
					{moods.length > 0 && (
						<div className="flex gap-1 flex-wrap justify-end max-w-[160px]">
							{moodTokens.map(({ mood, key }) => (
								<span
									key={key}
									className="text-xs px-2.5 py-1 rounded-full border"
									style={{
										backgroundColor: (MOOD_COLORS[mood] || "var(--color-secondary)") + "18",
										color: MOOD_COLORS[mood] || "var(--color-secondary)",
										borderColor: (MOOD_COLORS[mood] || "var(--color-secondary)") + "35",
									}}
								>
									{translateMoodLabel(mood)}
								</span>
							))}
							{moods.length > 2 && (
								<span className="text-xs text-[var(--color-text-secondary)]">
									+{moods.length - 2}
								</span>
							)}
						</div>
					)}
				</div>
			</div>
			{entry.reflection && (
				<p
					className="text-sm line-clamp-2"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{entry.reflection}
				</p>
			)}
		</button>
	);
};

export const EntryList = ({ entries, onSelectEntry }) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
			{entries.map((entry) => (
				<EntryCard
					key={entry?._id || entry?.id || entry?.session}
					entry={entry}
					onSelect={onSelectEntry}
				/>
			))}
		</div>
	);
};

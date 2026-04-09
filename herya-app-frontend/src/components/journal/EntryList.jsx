import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "@/utils/helpers";
import {
	resolveEntryId,
	toMoodTokens,
	translateMoodLabel,
	translateWithFallback,
	getMoodColorStyle,
} from "@/utils/journalHelpers";
import { Card, LoadingSpinner, SurfaceCard } from "@/components/ui";

// ── Skeleton ─────────────────────────────────────────────────────────────────
export const EntryCardSkeleton = () => (
	<SurfaceCard className="animate-pulse p-3.5 shadow-none">
		<div className="flex items-start justify-between gap-2 mb-2.5">
			<div className="min-w-0 flex-1">
				<div className="skeleton h-5 w-28 rounded-lg mb-1.5" />
				<div className="skeleton h-3 w-20 rounded-lg" />
			</div>
			<div className="flex gap-1">
				<div className="skeleton h-6 w-14 rounded-full" />
				<div className="skeleton h-6 w-14 rounded-full" />
			</div>
		</div>
		<div className="skeleton h-3 w-full rounded-lg mb-1" />
		<div className="skeleton h-3 w-3/4 rounded-lg" />
	</SurfaceCard>
);

// ── Entry Card ───────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onSelect }) => {
	const { t, lang } = useLanguage();

	const entryId = resolveEntryId(entry);
	const practiceType = entry?.session?.sessionType || entry?.sessionType;
	const moods = entry.moodAfter || entry.moodBefore || [];
	const moodTokens = toMoodTokens(moods.slice(0, 2), `entry-${entryId}`);
	const created = format.date(entry.date || entry.createdAt, lang);

	return (
		<Card
			onClick={() => onSelect(entry)}
			className="w-full p-3.5 transition duration-200 hover:-translate-y-[1px] shadow-none"
		>
			<div className="flex items-start justify-between gap-2 mb-2.5">
				<div className="min-w-0">
					<p
						className="font-display text-lg font-semibold leading-tight"
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
								t,
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
									style={getMoodColorStyle(mood)}
								>
									{translateMoodLabel(t, mood)}
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
		</Card>
	);
};

// ── Entry List ───────────────────────────────────────────────────────────────
export const EntryList = ({
	entries,
	onSelectEntry,
	hasMore = false,
	loadingMore = false,
	onLoadMore,
}) => {
	const { t } = useLanguage();
	const sentinelRef = useRef(null);

	// Infinite scroll via IntersectionObserver
	useEffect(() => {
		if (!hasMore || !onLoadMore) return;
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !loadingMore) {
					onLoadMore();
				}
			},
			{ rootMargin: "200px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, onLoadMore]);

	return (
		<div className="flex flex-col gap-2.5">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
				{entries.map((entry) => (
					<EntryCard
						key={resolveEntryId(entry)}
						entry={entry}
						onSelect={onSelectEntry}
					/>
				))}
			</div>

			{/* Load more sentinel / spinner */}
			{hasMore && (
				<div ref={sentinelRef} className="flex justify-center py-4">
					{loadingMore && <LoadingSpinner size={24} />}
				</div>
			)}

			{!hasMore && entries.length > 0 && (
				<p className="text-center text-xs py-2 text-[var(--color-text-muted)]">
					{t("journal.all_loaded") || "All entries loaded"}
				</p>
			)}
		</div>
	);
};

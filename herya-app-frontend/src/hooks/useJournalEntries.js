import { useState, useEffect, useCallback, useMemo } from "react";
import { getJournalEntries } from "@/api/journalEntries.api";
import { resolveEntryId } from "@/utils/journalHelpers";

const PAGE_SIZE = 30;

/**
 * Fetches journal entries with cursor-based "load more" pagination.
 * Returns only entries that have a resolvable ID.
 */
export const useJournalEntries = () => {
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(1);

	// Initial fetch
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		getJournalEntries({ limit: PAGE_SIZE, page: 1 })
			.then((r) => {
				if (cancelled) return;
				const payload = r.data?.data || r.data || {};
				const list =
					payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries(list);
				setHasMore(list.length >= PAGE_SIZE);
				setPage(1);
			})
			.catch(() => {
				if (!cancelled) setEntries([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const loadMore = useCallback(() => {
		if (loadingMore || !hasMore) return;
		const nextPage = page + 1;
		setLoadingMore(true);
		getJournalEntries({ limit: PAGE_SIZE, page: nextPage })
			.then((r) => {
				const payload = r.data?.data || r.data || {};
				const list =
					payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries((prev) => [...prev, ...list]);
				setHasMore(list.length >= PAGE_SIZE);
				setPage(nextPage);
			})
			.catch(() => {
				setHasMore(false);
			})
			.finally(() => {
				setLoadingMore(false);
			});
	}, [loadingMore, hasMore, page]);

	const entriesWithId = useMemo(
		() => entries.filter((entry) => resolveEntryId(entry)),
		[entries],
	);

	return { entries: entriesWithId, loading, loadingMore, hasMore, loadMore };
};

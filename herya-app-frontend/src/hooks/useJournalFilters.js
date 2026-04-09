import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { GARDEN_MOOD_ORDER } from "@/utils/constants";
import {
	ALL_MOODS,
	ALL_TYPES,
	filterJournalEntries,
	getDatePresetRange,
} from "@/utils/journalFilters";
import { getPracticeType, resolveEntryId } from "@/utils/journalHelpers";

const parseDateInput = (value) =>
	typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

const parseDatePreset = (value) => {
	const parsed = Number(value);
	return [7, 30, 90].includes(parsed) ? parsed : null;
};

/**
 * Manages all journal filter state, URL synchronisation, and derived
 * filtered/sorted results. Designed to be the single source of truth
 * between the URL and the UI.
 */
export const useJournalFilters = (entriesWithId) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// ── Filter state ──────────────────────────────────────────────────
	const [selectedMood, setSelectedMood] = useState(
		() => searchParams.get("mood") || "all",
	);
	const [selectedType, setSelectedType] = useState(
		() => searchParams.get("type") || "all",
	);
	const [dateFrom, setDateFrom] = useState(() =>
		parseDateInput(searchParams.get("from")),
	);
	const [dateTo, setDateTo] = useState(() =>
		parseDateInput(searchParams.get("to")),
	);
	const [activeDatePreset, setActiveDatePreset] = useState(() =>
		parseDatePreset(searchParams.get("preset")),
	);
	const [searchText, setSearchText] = useState(
		() => searchParams.get("q") || "",
	);
	const [debouncedSearchText, setDebouncedSearchText] = useState(
		() => searchParams.get("q") || "",
	);
	const [selectedEntryId, setSelectedEntryId] = useState(
		() => searchParams.get("entry") || null,
	);

	const isSearching = searchText !== debouncedSearchText;

	// ── Debounce search text ──────────────────────────────────────────
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearchText(searchText), 250);
		return () => clearTimeout(timer);
	}, [searchText]);

	// ── Sync URL → state (back/forward navigation) ───────────────────
	useEffect(() => {
		const next = {
			mood: searchParams.get("mood") || "all",
			type: searchParams.get("type") || "all",
			from: parseDateInput(searchParams.get("from")),
			to: parseDateInput(searchParams.get("to")),
			preset: parseDatePreset(searchParams.get("preset")),
			q: searchParams.get("q") || "",
			entry: searchParams.get("entry") || null,
		};
		setSelectedMood((c) => (c === next.mood ? c : next.mood));
		setSelectedType((c) => (c === next.type ? c : next.type));
		setDateFrom((c) => (c === next.from ? c : next.from));
		setDateTo((c) => (c === next.to ? c : next.to));
		setActiveDatePreset((c) => (c === next.preset ? c : next.preset));
		setSelectedEntryId((c) => (c === next.entry ? c : next.entry));
		setSearchText((c) => (c === next.q ? c : next.q));
		setDebouncedSearchText((c) => (c === next.q ? c : next.q));
	}, [searchParams]);

	// ── Sync state → URL ─────────────────────────────────────────────
	useEffect(() => {
		const next = new URLSearchParams();
		if (selectedMood !== "all") next.set("mood", selectedMood);
		if (selectedType !== "all") next.set("type", selectedType);
		if (dateFrom) next.set("from", dateFrom);
		if (dateTo) next.set("to", dateTo);
		if (activeDatePreset) next.set("preset", String(activeDatePreset));
		if (selectedEntryId) next.set("entry", String(selectedEntryId));
		const q = debouncedSearchText.trim();
		if (q) next.set("q", q);

		const nextStr = next.toString();
		setSearchParams(
			(prev) => (prev.toString() === nextStr ? prev : next),
			{ replace: true },
		);
	}, [
		activeDatePreset,
		debouncedSearchText,
		dateFrom,
		dateTo,
		selectedEntryId,
		selectedMood,
		selectedType,
		setSearchParams,
	]);

	// ── Clear invalid entry selection after data loads ────────────────
	const selected = useMemo(
		() =>
			entriesWithId.find(
				(e) => String(resolveEntryId(e)) === String(selectedEntryId),
			) || null,
		[entriesWithId, selectedEntryId],
	);

	// ── Derived: mood / type option lists ────────────────────────────
	const moodOptions = useMemo(() => {
		const set = new Set();
		entriesWithId.forEach((entry) => {
			(entry.moodAfter || entry.moodBefore || []).forEach((m) => {
				if (m) set.add(m);
			});
		});
		return Array.from(set).sort((a, b) => {
			const ia = GARDEN_MOOD_ORDER.indexOf(a);
			const ib = GARDEN_MOOD_ORDER.indexOf(b);
			if (ia === -1 && ib === -1) return a.localeCompare(b);
			if (ia === -1) return 1;
			if (ib === -1) return -1;
			return ia - ib;
		});
	}, [entriesWithId]);

	const practiceTypeOptions = useMemo(() => {
		const set = new Set();
		entriesWithId.forEach((entry) => {
			const type = getPracticeType(entry);
			if (type) set.add(type);
		});
		return Array.from(set);
	}, [entriesWithId]);

	// ── Derived: filtered & sorted entries ───────────────────────────
	const filteredEntries = useMemo(
		() =>
			filterJournalEntries({
				entries: entriesWithId,
				selectedMood: selectedMood || ALL_MOODS,
				selectedType: selectedType || ALL_TYPES,
				dateFrom,
				dateTo,
				searchText: debouncedSearchText,
				getPracticeType,
			}).sort(
				(a, b) =>
					new Date(b.date || b.createdAt).getTime() -
					new Date(a.date || a.createdAt).getTime(),
			),
		[dateFrom, dateTo, debouncedSearchText, entriesWithId, selectedMood, selectedType],
	);

	// ── Actions ──────────────────────────────────────────────────────
	const handleSelectEntry = (entry) => {
		const id = resolveEntryId(entry);
		if (id) setSelectedEntryId(String(id));
	};

	const handleClearFilters = () => {
		setSelectedMood("all");
		setSelectedType("all");
		setDateFrom("");
		setDateTo("");
		setActiveDatePreset(null);
		setSearchText("");
		setDebouncedSearchText("");
	};

	const handleApplyDatePreset = (days) => {
		const { from, to } = getDatePresetRange(days);
		setDateFrom(from);
		setDateTo(to);
		setActiveDatePreset(days);
	};

	const hasActiveFilters =
		searchText !== "" ||
		selectedMood !== "all" ||
		selectedType !== "all" ||
		dateFrom !== "" ||
		dateTo !== "";

	return {
		// Filter state
		searchText,
		setSearchText,
		selectedMood,
		setSelectedMood,
		selectedType,
		setSelectedType,
		dateFrom,
		setDateFrom,
		dateTo,
		setDateTo,
		activeDatePreset,
		setActiveDatePreset,
		selectedEntryId,
		setSelectedEntryId,
		isSearching,
		hasActiveFilters,

		// Derived data
		moodOptions,
		practiceTypeOptions,
		filteredEntries,
		selected,

		// Actions
		handleSelectEntry,
		handleClearFilters,
		handleApplyDatePreset,
	};
};

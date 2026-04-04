import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { getJournalEntries } from "@/api/journalEntries.api";
import { JournalHeader } from "@/components/journal/JournalHeader";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { EntryList } from "@/components/journal/EntryList";
import { EntryModal } from "@/components/journal/EntryModal";
import { TutorJournalSummary } from "@/components/journal/TutorJournalSummary";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { GARDEN_MOOD_ORDER } from "@/utils/constants";
import {
	ALL_MOODS,
	ALL_TYPES,
	filterJournalEntries,
	getDatePresetRange,
} from "@/utils/journalFilters";

const resolveEntryId = (entry) =>
	entry?._id || entry?.id || entry?.session || null;

const getPracticeType = (entry) =>
	entry?.session?.sessionType || entry?.sessionType || null;

const parseDateInput = (value) =>
	typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";

const parseDatePreset = (value) => {
	const parsed = Number(value);
	return [7, 30, 90].includes(parsed) ? parsed : null;
};

export default function Journal() {
	const { t } = useLanguage();
	const { user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedEntryId, setSelectedEntryId] = useState(
		() => searchParams.get("entry") || null,
	);
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
	const isTutorMode = user?.role === "tutor";

	const entriesWithId = useMemo(
		() => entries.filter((entry) => resolveEntryId(entry)),
		[entries],
	);

	const moodOptions = useMemo(() => {
		const set = new Set();
		entriesWithId.forEach((entry) => {
			(entry.moodAfter || entry.moodBefore || []).forEach((mood) => {
				if (mood) set.add(mood);
			});
		});
		return Array.from(set).sort((a, b) => {
			const indexA = GARDEN_MOOD_ORDER.indexOf(a);
			const indexB = GARDEN_MOOD_ORDER.indexOf(b);
			if (indexA === -1 && indexB === -1) return a.localeCompare(b);
			if (indexA === -1) return 1;
			if (indexB === -1) return -1;
			return indexA - indexB;
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

	const filteredEntries = useMemo(() => {
		return filterJournalEntries({
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
		);
	}, [
		dateFrom,
		dateTo,
		debouncedSearchText,
		entriesWithId,
		selectedMood,
		selectedType,
	]);

	const selected = useMemo(
		() =>
			entriesWithId.find(
				(entry) => String(resolveEntryId(entry)) === String(selectedEntryId),
			) || null,
		[entriesWithId, selectedEntryId],
	);

	useEffect(() => {
		getJournalEntries({ limit: 50 })
			.then((r) => {
				const payload = r.data?.data || r.data || {};
				const list =
					payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries(list);
			})
			.catch(() => setEntries([]))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchText(searchText);
		}, 250);

		return () => clearTimeout(timer);
	}, [searchText]);

	useEffect(() => {
		const nextMood = searchParams.get("mood") || "all";
		const nextType = searchParams.get("type") || "all";
		const nextFrom = parseDateInput(searchParams.get("from"));
		const nextTo = parseDateInput(searchParams.get("to"));
		const nextPreset = parseDatePreset(searchParams.get("preset"));
		const nextQuery = searchParams.get("q") || "";
		const nextEntryId = searchParams.get("entry") || null;

		setSelectedMood((current) => (current === nextMood ? current : nextMood));
		setSelectedType((current) => (current === nextType ? current : nextType));
		setDateFrom((current) => (current === nextFrom ? current : nextFrom));
		setDateTo((current) => (current === nextTo ? current : nextTo));
		setActiveDatePreset((current) =>
			current === nextPreset ? current : nextPreset,
		);
		setSelectedEntryId((current) =>
			current === nextEntryId ? current : nextEntryId,
		);
		setSearchText((current) => (current === nextQuery ? current : nextQuery));
		setDebouncedSearchText((current) =>
			current === nextQuery ? current : nextQuery,
		);
	}, [searchParams]);

	useEffect(() => {
		if (!loading && selectedEntryId && !selected) {
			setSelectedEntryId(null);
		}
	}, [loading, selected, selectedEntryId]);

	useEffect(() => {
		const nextParams = new URLSearchParams();

		if (selectedMood !== "all") nextParams.set("mood", selectedMood);
		if (selectedType !== "all") nextParams.set("type", selectedType);
		if (dateFrom) nextParams.set("from", dateFrom);
		if (dateTo) nextParams.set("to", dateTo);
		if (activeDatePreset) nextParams.set("preset", String(activeDatePreset));
		if (selectedEntryId) nextParams.set("entry", String(selectedEntryId));

		const query = debouncedSearchText.trim();
		if (query) nextParams.set("q", query);

		const next = nextParams.toString();
		setSearchParams(
			(previousParams) => {
				if (previousParams.toString() === next) return previousParams;
				return nextParams;
			},
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

	const handleSelectEntry = (entry) => {
		const id = resolveEntryId(entry);
		if (!id) return;
		setSelectedEntryId(String(id));
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

	return (
		<div className="flex flex-col gap-6 pt-4 pb-6">
			{/* Header */}
			<JournalHeader entryCount={entriesWithId.length} />

			{/* Loading State */}
			{loading ? (
				<div className="mx-4 rounded-3xl h-72 bg-[var(--color-border)] animate-pulse" />
			) : entriesWithId.length === 0 ? (
				/* Empty State */
				<EmptyState
					icon={<BookOpen size={36} />}
					title={t("journal.empty_title")}
					description={t("journal.empty_hint")}
					className="mx-4"
				/>
			) : (
				/* Main Content */
				<div className="px-4 flex flex-col gap-3">
					{isTutorMode && <TutorJournalSummary entries={filteredEntries} />}

					{/* Filters */}
					<JournalFilters
						searchText={searchText}
						onSearchChange={setSearchText}
						selectedMood={selectedMood}
						onMoodChange={setSelectedMood}
						moodOptions={moodOptions}
						selectedType={selectedType}
						onTypeChange={setSelectedType}
						typeOptions={practiceTypeOptions}
						dateFrom={dateFrom}
						onDateFromChange={(value) => {
							setDateFrom(value);
							setActiveDatePreset(null);
						}}
						dateTo={dateTo}
						onDateToChange={(value) => {
							setDateTo(value);
							setActiveDatePreset(null);
						}}
						activeDatePreset={activeDatePreset}
						onPresetClick={handleApplyDatePreset}
						onClearFilters={handleClearFilters}
						filteredCount={filteredEntries.length}
						totalCount={entriesWithId.length}
					/>

					{/* Entry List */}
					{filteredEntries.length === 0 ? (
						<EmptyState
							icon={<BookOpen size={28} />}
							title={t("journal.no_matches_title")}
							description={t("journal.no_matches_hint")}
						/>
					) : (
						<EntryList
							entries={filteredEntries}
							onSelectEntry={handleSelectEntry}
						/>
					)}
				</div>
			)}

			{/* Entry Detail Modal */}
			<EntryModal
				entry={selected}
				isOpen={!!selectedEntryId}
				onClose={() => setSelectedEntryId(null)}
			/>
		</div>
	);
}

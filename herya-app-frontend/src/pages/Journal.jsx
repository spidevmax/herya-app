import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { JournalHeader } from "@/components/journal/JournalHeader";
import { JournalFilters } from "@/components/journal/JournalFilters";
import { EntryList, EntryCardSkeleton } from "@/components/journal/EntryList";
import { EntryModal } from "@/components/journal/EntryModal";
import { TutorJournalSummary } from "@/components/journal/TutorJournalSummary";
import { EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useJournalFilters } from "@/hooks/useJournalFilters";

const Journal = () => {
	const { t } = useLanguage();
	const { user } = useAuth();
	const { entries, loading, loadingMore, hasMore, loadMore } =
		useJournalEntries();

	const {
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
		moodOptions,
		practiceTypeOptions,
		filteredEntries,
		selected,
		handleSelectEntry,
		handleClearFilters,
		handleApplyDatePreset,
	} = useJournalFilters(entries);

	const isTutorMode = user?.role === "tutor";

	// Clear invalid entry selection after data loads
	useEffect(() => {
		if (!loading && selectedEntryId && !selected) {
			setSelectedEntryId(null);
		}
	}, [loading, selected, selectedEntryId, setSelectedEntryId]);

	return (
		<div className="flex flex-col gap-6 pt-4 pb-6">
			<JournalHeader entryCount={entries.length} />

			{loading ? (
				<div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
					{["a", "b", "c", "d", "e", "f"].map((id) => (
						<EntryCardSkeleton key={`skel-${id}`} />
					))}
				</div>
			) : entries.length === 0 ? (
				<EmptyState
					icon={<BookOpen size={36} />}
					title={t("journal.empty_title")}
					description={t("journal.empty_hint")}
					className="mx-4"
				/>
			) : (
				<div className="px-4 flex flex-col gap-3">
					{isTutorMode && <TutorJournalSummary entries={filteredEntries} />}

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
						totalCount={entries.length}
						isSearching={isSearching}
						hasActiveFilters={hasActiveFilters}
					/>

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
							hasMore={hasMore}
							loadingMore={loadingMore}
							onLoadMore={loadMore}
						/>
					)}
				</div>
			)}

			<EntryModal
				entry={selected}
				isOpen={!!selectedEntryId}
				onClose={() => setSelectedEntryId(null)}
			/>
		</div>
	);
};

export default Journal;

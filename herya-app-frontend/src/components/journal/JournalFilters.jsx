import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import {
	ChipButton,
	SearchBar,
	SelectField,
	SurfaceCard,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { translateMoodLabel, translateWithFallback } from "@/utils/journalHelpers";

const DATE_PRESETS = [7, 30, 90];

export const JournalFilters = ({
	searchText,
	onSearchChange,
	selectedMood,
	onMoodChange,
	moodOptions,
	selectedType,
	onTypeChange,
	typeOptions,
	dateFrom,
	onDateFromChange,
	dateTo,
	onDateToChange,
	activeDatePreset,
	onPresetClick,
	onClearFilters,
	filteredCount,
	totalCount,
	isSearching = false,
	hasActiveFilters = false,
}) => {
	const { t } = useLanguage();
	const [filtersOpen, setFiltersOpen] = useState(false);

	const activeFilterCount = [
		selectedMood !== "all",
		selectedType !== "all",
		!!dateFrom,
		!!dateTo,
	].filter(Boolean).length;

	return (
		<SurfaceCard role="search" aria-label={t("journal.filters_label")} className="flex flex-col gap-3 p-3 shadow-none">
			{/* Search + toggle row */}
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<SearchBar
						value={searchText}
						onChange={onSearchChange}
						placeholder={t("journal.search_placeholder")}
						label={t("journal.search_placeholder")}
						className="[&_.input-base]:h-10 [&_.input-base]:rounded-xl [&_.input-base]:bg-[var(--color-surface)] [&_.input-base]:px-3 [&_.input-base]:pl-4 [&_.input-base]:pr-8"
					/>
					{isSearching && (
						<Loader2
							size={14}
							aria-hidden="true"
							className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-text-muted)]"
						/>
					)}
				</div>

				<button
					type="button"
					onClick={() => setFiltersOpen((o) => !o)}
					aria-expanded={filtersOpen}
					aria-controls="journal-filters-panel"
					className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition"
					style={{
						backgroundColor: hasActiveFilters
							? "var(--color-primary)"
							: "var(--color-surface)",
						color: hasActiveFilters ? "white" : "var(--color-text-secondary)",
						border: "1px solid var(--color-border-soft)",
					}}
				>
					{t("journal.filters_label")}
					{activeFilterCount > 0 && (
						<span
							className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
							style={{
								backgroundColor: hasActiveFilters
									? "white"
									: "var(--color-primary)",
								color: hasActiveFilters
									? "var(--color-primary)"
									: "white",
							}}
						>
							{activeFilterCount}
						</span>
					)}
					<ChevronDown
						size={14}
						aria-hidden="true"
						className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`}
					/>
				</button>
			</div>

			{/* Collapsible filter panel */}
			<AnimatePresence initial={false}>
				{filtersOpen && (
					<motion.div
						id="journal-filters-panel"
						role="region"
						aria-label={t("journal.filters_label")}
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className="flex flex-col gap-3 pt-1">
							{/* Clear filters */}
							<div className="flex items-center justify-between">
								<p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
									{t("journal.filters_label")}
								</p>
								{hasActiveFilters && (
									<button
										type="button"
										onClick={onClearFilters}
										className="text-[11px] font-semibold"
										style={{ color: "var(--color-primary)" }}
									>
										{t("journal.clear_filters")}
									</button>
								)}
							</div>

							{/* Mood + Type + Date selects */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
								<div>
									<label
										htmlFor="journal-filter-mood"
										className="sr-only"
									>
										{t("journal.all_moods")}
									</label>
									<SelectField
										id="journal-filter-mood"
										label={t("journal.all_moods")}
										value={selectedMood}
										onChange={(e) => onMoodChange(e.target.value)}
										className="[&_.select-base]:h-10 [&_.select-base]:bg-[var(--color-surface)]"
									>
										<option value="all">{t("journal.all_moods")}</option>
										{moodOptions.map((mood) => (
											<option key={`mood-${mood}`} value={mood}>
												{translateMoodLabel(t, mood)}
											</option>
										))}
									</SelectField>
								</div>

								<div>
									<label
										htmlFor="journal-filter-type"
										className="sr-only"
									>
										{t("journal.all_types")}
									</label>
									<SelectField
										id="journal-filter-type"
										label={t("journal.all_types")}
										value={selectedType}
										onChange={(e) => onTypeChange(e.target.value)}
										className="[&_.select-base]:h-10 [&_.select-base]:bg-[var(--color-surface)]"
									>
										<option value="all">{t("journal.all_types")}</option>
										{typeOptions.map((type) => (
											<option key={`type-${type}`} value={type}>
												{translateWithFallback(
													t,
													`journal.practice_types.${type}`,
													type,
												)}
											</option>
										))}
									</SelectField>
								</div>

								<div>
									<label
										htmlFor="journal-filter-from"
										className="sr-only"
									>
										{t("journal.date_from")}
									</label>
									<input
										id="journal-filter-from"
										type="date"
										value={dateFrom}
										onChange={(e) => onDateFromChange(e.target.value)}
										max={dateTo || undefined}
										aria-label={t("journal.date_from")}
										className="select-base h-10 bg-[var(--color-surface)]"
										style={{
											color: "var(--color-text-primary)",
										}}
									/>
								</div>

								<div>
									<label
										htmlFor="journal-filter-to"
										className="sr-only"
									>
										{t("journal.date_to")}
									</label>
									<input
										id="journal-filter-to"
										type="date"
										value={dateTo}
										onChange={(e) => onDateToChange(e.target.value)}
										min={dateFrom || undefined}
										aria-label={t("journal.date_to")}
										className="select-base h-10 bg-[var(--color-surface)]"
										style={{
											color: "var(--color-text-primary)",
										}}
									/>
								</div>
							</div>

							{/* Date presets */}
							<div className="flex flex-wrap gap-2">
								{DATE_PRESETS.map((days) => (
									<ChipButton
										key={`preset-${days}`}
										onClick={() => onPresetClick(days)}
										active={activeDatePreset === days}
										className="rounded-lg px-2.5 py-1.5 normal-case"
									>
										{days}
										{t("profile.days")}
									</ChipButton>
								))}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Summary */}
			<p className="text-xs text-[var(--color-text-secondary)]">
				{t("journal.showing_summary", {
					shown: filteredCount,
					total: totalCount,
				})}
			</p>
		</SurfaceCard>
	);
};

import { useLanguage } from "@/context/LanguageContext";

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
}) => {
	const { t } = useLanguage();

	const translateMoodLabel = (mood) => {
		const key = `session.moods.${mood}`;
		const translated = t(key);
		return translated === key ? mood : translated;
	};

	const getPracticeTypeLabel = (type) => {
		const key = `journal.practice_types.${type}`;
		const translated = t(key);
		return translated === key ? type : translated;
	};

	const hasActiveFilters =
		searchText ||
		selectedMood !== "all" ||
		selectedType !== "all" ||
		dateFrom ||
		dateTo;

	return (
		<div
			className="rounded-2xl p-3 flex flex-col gap-3"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<div className="flex items-center justify-between gap-2">
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

			{/* Search */}
			<input
				type="text"
				value={searchText}
				onChange={(e) => onSearchChange(e.target.value)}
				placeholder={t("journal.search_placeholder")}
				className="h-10 rounded-xl px-3 text-sm outline-none w-full"
				style={{
					backgroundColor: "var(--color-surface)",
					color: "var(--color-text-primary)",
					border: "1px solid var(--color-border-soft)",
				}}
			/>

			{/* Mood, Type, Date Filters */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
				<select
					value={selectedMood}
					onChange={(e) => onMoodChange(e.target.value)}
					className="h-10 rounded-xl px-3 text-sm outline-none"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-soft)",
					}}
				>
					<option value="all">{t("journal.all_moods")}</option>
					{moodOptions.map((mood) => (
						<option key={`mood-${mood}`} value={mood}>
							{translateMoodLabel(mood)}
						</option>
					))}
				</select>

				<select
					value={selectedType}
					onChange={(e) => onTypeChange(e.target.value)}
					className="h-10 rounded-xl px-3 text-sm outline-none"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-soft)",
					}}
				>
					<option value="all">{t("journal.all_types")}</option>
					{typeOptions.map((type) => (
						<option key={`type-${type}`} value={type}>
							{getPracticeTypeLabel(type)}
						</option>
					))}
				</select>

				<input
					type="date"
					value={dateFrom}
					onChange={(e) => onDateFromChange(e.target.value)}
					max={dateTo || undefined}
					className="h-10 rounded-xl px-3 text-sm outline-none"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-soft)",
					}}
				/>

				<input
					type="date"
					value={dateTo}
					onChange={(e) => onDateToChange(e.target.value)}
					min={dateFrom || undefined}
					className="h-10 rounded-xl px-3 text-sm outline-none"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-soft)",
					}}
				/>
			</div>

			{/* Date Presets */}
			<div className="flex flex-wrap gap-2">
				{DATE_PRESETS.map((days) => (
					<button
						type="button"
						key={`preset-${days}`}
						onClick={() => onPresetClick(days)}
						className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
						style={{
							backgroundColor:
								activeDatePreset === days
									? "var(--color-primary)"
									: "var(--color-surface)",
							color:
								activeDatePreset === days
									? "white"
									: "var(--color-text-secondary)",
							border: "1px solid var(--color-border-soft)",
						}}
					>
						{days}
						{t("profile.days")}
					</button>
				))}
			</div>

			{/* Summary */}
			<p className="text-xs text-[var(--color-text-secondary)]">
				{t("journal.showing_summary", {
					shown: filteredCount,
					total: totalCount,
				})}
			</p>
		</div>
	);
};

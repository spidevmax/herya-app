export const ALL_MOODS = "all";
export const ALL_TYPES = "all";

export const getEntryTimestamp = (entry) => {
	const raw = entry?.date || entry?.createdAt;
	if (!raw) return null;
	const ts = new Date(raw).getTime();
	return Number.isNaN(ts) ? null : ts;
};

export const getDatePresetRange = (days, now = new Date()) => {
	const today = new Date(now);
	const from = new Date(today);
	from.setDate(today.getDate() - (days - 1));

	return {
		from: from.toISOString().slice(0, 10),
		to: today.toISOString().slice(0, 10),
	};
};

export const filterGardenEntries = ({
	entries,
	selectedMood,
	selectedType,
	dateFrom,
	dateTo,
	searchText,
	getPracticeType,
}) => {
	const query = String(searchText || "")
		.trim()
		.toLowerCase();
	const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
	const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

	return entries.filter((entry) => {
		const moods = entry.moodAfter || entry.moodBefore || [];
		const moodOk = selectedMood === ALL_MOODS || moods.includes(selectedMood);

		const type = getPracticeType(entry);
		const typeOk = selectedType === ALL_TYPES || type === selectedType;

		const ts = getEntryTimestamp(entry);
		const fromOk = fromTs === null || (ts !== null && ts >= fromTs);
		const toOk = toTs === null || (ts !== null && ts <= toTs);

		const searchableText = `${entry.reflection || ""} ${entry.insights || ""}`
			.toLowerCase()
			.trim();
		const textOk = query.length === 0 || searchableText.includes(query);

		return moodOk && typeOk && fromOk && toOk && textOk;
	});
};

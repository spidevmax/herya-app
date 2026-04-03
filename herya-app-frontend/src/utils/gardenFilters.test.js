import { describe, expect, it } from "vitest";
import {
	ALL_MOODS,
	ALL_TYPES,
	filterGardenEntries,
	getDatePresetRange,
} from "./gardenFilters";

const getPracticeType = (entry) => entry.sessionType || null;

const ENTRIES = [
	{
		id: "1",
		date: "2026-03-30T10:00:00.000Z",
		moodAfter: ["calm"],
		sessionType: "meditation",
		reflection: "I felt calm and clear",
		insights: "Breathe slower",
	},
	{
		id: "2",
		date: "2026-03-10T10:00:00.000Z",
		moodAfter: ["energized"],
		sessionType: "pranayama",
		reflection: "Strong energy",
		insights: "Box breathing helped",
	},
];

describe("getDatePresetRange", () => {
	it("returns expected ISO date boundaries", () => {
		const now = new Date("2026-04-03T12:00:00.000Z");
		const range = getDatePresetRange(7, now);
		expect(range).toEqual({ from: "2026-03-28", to: "2026-04-03" });
	});
});

describe("filterGardenEntries", () => {
	it("filters by mood", () => {
		const result = filterGardenEntries({
			entries: ENTRIES,
			selectedMood: "calm",
			selectedType: ALL_TYPES,
			dateFrom: "",
			dateTo: "",
			searchText: "",
			getPracticeType,
		});
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("1");
	});

	it("filters by type + date range + query", () => {
		const result = filterGardenEntries({
			entries: ENTRIES,
			selectedMood: ALL_MOODS,
			selectedType: "pranayama",
			dateFrom: "2026-03-01",
			dateTo: "2026-03-31",
			searchText: "box",
			getPracticeType,
		});
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("2");
	});

	it("returns all entries for empty filters", () => {
		const result = filterGardenEntries({
			entries: ENTRIES,
			selectedMood: ALL_MOODS,
			selectedType: ALL_TYPES,
			dateFrom: "",
			dateTo: "",
			searchText: "",
			getPracticeType,
		});
		expect(result).toHaveLength(2);
	});

	it("includes entries on exact date boundaries", () => {
		const result = filterGardenEntries({
			entries: ENTRIES,
			selectedMood: ALL_MOODS,
			selectedType: ALL_TYPES,
			dateFrom: "2026-03-10",
			dateTo: "2026-03-30",
			searchText: "",
			getPracticeType,
		});

		expect(result).toHaveLength(2);
	});

	it("excludes entries with invalid dates when date filter is active", () => {
		const entriesWithInvalidDate = [
			...ENTRIES,
			{
				id: "3",
				date: "invalid-date",
				moodAfter: ["calm"],
				sessionType: "meditation",
				reflection: "Bad date entry",
				insights: "Should not pass date filter",
			},
		];

		const result = filterGardenEntries({
			entries: entriesWithInvalidDate,
			selectedMood: ALL_MOODS,
			selectedType: ALL_TYPES,
			dateFrom: "2026-03-01",
			dateTo: "2026-03-31",
			searchText: "",
			getPracticeType,
		});

		expect(result.map((entry) => entry.id)).toEqual(["1", "2"]);
	});
});

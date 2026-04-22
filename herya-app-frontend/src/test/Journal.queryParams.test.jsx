/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Journal from "../pages/Journal";

vi.mock("@/api/journalEntries.api", () => ({
	getJournalEntries: vi.fn(),
}));

vi.mock("@/utils/helpers", () => ({
	format: {
		date: (value) => String(value).slice(0, 10),
	},
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key, vars) => {
			const dict = {
				"journal.title": "Your Journal",
				"journal.entries_plural": "journal entries",
				"journal.entries_singular": "journal entry",
				"journal.filters_label": "Filters",
				"journal.clear_filters": "Clear",
				"journal.search_placeholder": "Search insights/reflection",
				"journal.all_moods": "All moods",
				"journal.all_types": "All types",
				"journal.no_matches_title": "No matches for these filters",
				"journal.no_matches_hint":
					"Try removing mood/type filters or expanding dates.",
				"journal.tap_hint": "Tap a flower to see the entry",
				"profile.days": "d",
				"ui.close_modal": "Close modal",
				"journal.reflection_label": "Reflection",
				"journal.practice_type_label": "Practice Type",
				"session.duration_label": "Duration",
				"profile.minutes": "min",
			};

			if (key === "journal.showing_summary") {
				return `Showing ${vars?.shown} of ${vars?.total} entries`;
			}

			if (key === "journal.open_entry_aria") {
				return `Open entry ${vars?.date}`;
			}

			if (key.startsWith("journal.practice_types.")) {
				return key;
			}

			return dict[key] || key;
		},
	}),
}));

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({
		user: { role: "user" },
	}),
}));

const sanitizeMotionProps = (props) => {
	const domProps = { ...props };
	delete domProps.initial;
	delete domProps.animate;
	delete domProps.exit;
	delete domProps.transition;
	delete domProps.whileHover;
	delete domProps.whileTap;
	return domProps;
};

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }) => (
			<div {...sanitizeMotionProps(props)}>{children}</div>
		),
		button: ({ children, ...props }) => (
			<button {...sanitizeMotionProps(props)}>{children}</button>
		),
	},
	AnimatePresence: ({ children }) => <>{children}</>,
}));

import { getJournalEntries } from "@/api/journalEntries.api";

const JOURNALS = [
	{
		_id: "j1",
		date: "2026-03-30T10:00:00.000Z",
		moodAfter: ["calm"],
		sessionType: "meditation",
		reflection: "Clear mind",
		insights: "Breathe slower",
	},
	{
		_id: "j2",
		date: "2026-03-10T10:00:00.000Z",
		moodAfter: ["energized"],
		sessionType: "pranayama",
		reflection: "Strong energy",
		insights: "Box breathing helped",
	},
];

const LocationProbe = () => {
	const location = useLocation();
	return <div data-testid="location-search">{location.search}</div>;
};

const renderJournal = (initialEntry) =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route
					path="/journal"
					element={
						<>
							<Journal />
							<LocationProbe />
						</>
					}
				/>
			</Routes>
		</MemoryRouter>,
	);

describe("Journal query params integration", () => {
	beforeEach(() => {
		vi.mocked(getJournalEntries).mockResolvedValue({
			data: { data: { journals: JOURNALS } },
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("hydrates controls from URL query params", async () => {
		const view = renderJournal(
			"/journal?mood=calm&type=meditation&from=2026-03-01&to=2026-03-31&preset=30&q=clear",
		);
		const ui = within(view.container);

		await waitFor(() => {
			expect(vi.mocked(getJournalEntries)).toHaveBeenCalled();
		});

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		expect(searchInput.value).toBe("clear");

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("calm");
		expect(typeSelect.value).toBe("meditation");

		expect(ui.getByDisplayValue("2026-03-01")).toBeTruthy();
		expect(ui.getByDisplayValue("2026-03-31")).toBeTruthy();
	});

	it("syncs URL when user changes filters and search", async () => {
		const view = renderJournal("/journal");
		const ui = within(view.container);

		await waitFor(() => {
			expect(
				ui.getByPlaceholderText("Search insights/reflection"),
			).toBeTruthy();
		});

		const [moodSelect] = ui.getAllByRole("combobox");
		fireEvent.change(moodSelect, { target: { value: "calm" } });

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		fireEvent.change(searchInput, { target: { value: "breathe" } });

		await waitFor(() => {
			const search = ui.getByTestId("location-search").textContent || "";
			expect(search).toContain("q=breathe");
		});

		const search = ui.getByTestId("location-search").textContent || "";
		expect(search).toContain("mood=calm");
	});

	it("shows all entries by default when no filters are set", async () => {
		const view = renderJournal("/journal");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByText("Showing 2 of 2 entries")).toBeTruthy();
		});

		expect(ui.queryByText("No matches for these filters")).toBeNull();
	});

	it("persists selected entry in URL and restores modal from query", async () => {
		const view = renderJournal("/journal?entry=j2");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByRole("button", { name: "Close modal" })).toBeTruthy();
		});

		expect(ui.getAllByText("Strong energy").length).toBeGreaterThan(0);

		expect(ui.getByTestId("location-search").textContent).toContain("entry=j2");
		fireEvent.click(ui.getByRole("button", { name: "Close modal" }));
		expect(ui.getByTestId("location-search").textContent).not.toContain(
			"entry=j2",
		);
	});
});

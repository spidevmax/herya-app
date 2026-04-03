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
import Garden from "./Garden";

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
				"garden.title": "Your Garden",
				"garden.entries_plural": "journal entries",
				"garden.entries_singular": "journal entry",
				"garden.view_graph": "Graph",
				"garden.view_flowers": "Flowers",
				"garden.filters_label": "Filters",
				"garden.clear_filters": "Clear",
				"garden.search_placeholder": "Search insights/reflection",
				"garden.all_moods": "All moods",
				"garden.all_types": "All types",
				"garden.no_matches_title": "No matches for these filters",
				"garden.no_matches_hint":
					"Try removing mood/type filters or expanding dates.",
				"garden.graph_title": "Garden Graph",
				"garden.tap_hint": "Tap a flower to see the entry",
				"profile.days": "d",
				"ui.close_modal": "Close modal",
			};

			if (key === "garden.showing_summary") {
				return `Showing ${vars?.shown} of ${vars?.total} entries`;
			}

			if (key === "garden.open_entry_aria") {
				return `Open entry ${vars?.date}`;
			}

			if (key.startsWith("garden.practice_types.")) {
				return key;
			}

			return dict[key] || key;
		},
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

const renderGarden = (initialEntry) =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route
					path="/garden"
					element={
						<>
							<Garden />
							<LocationProbe />
						</>
					}
				/>
			</Routes>
		</MemoryRouter>,
	);

describe("Garden query params integration", () => {
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
		const view = renderGarden(
			"/garden?view=flowers&mood=calm&type=meditation&from=2026-03-01&to=2026-03-31&preset=30&q=clear",
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
		expect(ui.getByTestId("location-search").textContent).toContain(
			"view=flowers",
		);
	});

	it("syncs URL when user changes filters and search", async () => {
		const view = renderGarden("/garden");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByRole("button", { name: "Graph" })).toBeTruthy();
		});

		const [moodSelect] = ui.getAllByRole("combobox");
		fireEvent.change(moodSelect, { target: { value: "calm" } });
		fireEvent.click(ui.getByRole("button", { name: "Flowers" }));

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		fireEvent.change(searchInput, { target: { value: "breathe" } });

		await waitFor(() => {
			const search = ui.getByTestId("location-search").textContent || "";
			expect(search).toContain("q=breathe");
		});

		const search = ui.getByTestId("location-search").textContent || "";
		expect(search).toContain("view=flowers");
		expect(search).toContain("mood=calm");
	});

	it("persists selected entry in URL and restores modal from query", async () => {
		const view = renderGarden("/garden?entry=j2");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByText("Strong energy")).toBeTruthy();
		});

		expect(ui.getByTestId("location-search").textContent).toContain("entry=j2");
		fireEvent.click(ui.getByRole("button", { name: "Close modal" }));
		expect(ui.getByTestId("location-search").textContent).not.toContain(
			"entry=j2",
		);
	});
});

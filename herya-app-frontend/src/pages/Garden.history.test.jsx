/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import {
	MemoryRouter,
	Route,
	Routes,
	useLocation,
	useNavigate,
} from "react-router-dom";
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

const NavigatorLink = ({ to, label, testId }) => {
	const navigate = useNavigate();
	return (
		<button
			data-testid={testId}
			type="button"
			onClick={() => {
				navigate(to);
			}}
		>
			{label}
		</button>
	);
};

const renderGardenWithNavigation = (initialEntry = "/garden") =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route
					path="/garden"
					element={
						<>
							<Garden />
							<LocationProbe />
							<NavigatorLink
								to="/dummy"
								label="Go to Dummy"
								testId="go-dummy"
							/>
						</>
					}
				/>
				<Route path="/dummy" element={<div data-testid="dummy">Dummy</div>} />
			</Routes>
		</MemoryRouter>,
	);

describe("Garden browser history navigation", () => {
	beforeEach(() => {
		vi.mocked(getJournalEntries).mockResolvedValue({
			data: { data: { journals: JOURNALS } },
		});
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("hydrates from URL on initial load and restores after transitioning away and back", async () => {
		const view = renderGardenWithNavigation(
			"/garden?view=flowers&mood=calm&type=meditation",
		);
		const ui = within(view.container);

		await waitFor(() => {
			expect(vi.mocked(getJournalEntries)).toHaveBeenCalled();
		});

		const flowersBtn = ui.getByRole("button", { name: "Flowers" });
		expect(flowersBtn).toBeTruthy();

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("calm");
		expect(typeSelect.value).toBe("meditation");

		const search = ui.getByTestId("location-search").textContent;
		expect(search).toContain("view=flowers");
		expect(search).toContain("mood=calm");
		expect(search).toContain("type=meditation");
	});

	it("preserves URL state after changing filters locally", async () => {
		const view = renderGardenWithNavigation("/garden?view=flowers&mood=calm");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByRole("button", { name: "Flowers" })).toBeTruthy();
		});

		const [, typeSelect] = ui.getAllByRole("combobox");
		fireEvent.change(typeSelect, { target: { value: "meditation" } });

		await waitFor(() => {
			expect(ui.getByTestId("location-search").textContent).toContain(
				"type=meditation",
			);
		});

		expect(ui.getByTestId("location-search").textContent).toContain(
			"mood=calm",
		);
		expect(ui.getByTestId("location-search").textContent).toContain(
			"view=flowers",
		);
	});

	it("restores complete state when navigating to a URL with encoded filters", async () => {
		const complexUrl =
			"/garden?view=flowers&mood=calm&from=2026-03-01&to=2026-03-31&preset=30&q=clear&type=meditation&entry=j1";
		const view = renderGardenWithNavigation(complexUrl);
		const ui = within(view.container);

		await waitFor(() => {
			expect(vi.mocked(getJournalEntries)).toHaveBeenCalled();
		});

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		await waitFor(() => {
			expect(searchInput.value).toBe("clear");
		});

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("calm");
		expect(typeSelect.value).toBe("meditation");

		expect(ui.getByDisplayValue("2026-03-01")).toBeTruthy();
		expect(ui.getByDisplayValue("2026-03-31")).toBeTruthy();

		expect(ui.getByTestId("location-search").textContent).toContain("entry=j1");
	});

	it("handles URL without query params as clean state", async () => {
		const view = renderGardenWithNavigation("/garden");
		const ui = within(view.container);

		await waitFor(() => {
			expect(ui.getByRole("button", { name: "Graph" })).toBeTruthy();
		});

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		expect(searchInput.value).toBe("");

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("all");
		expect(typeSelect.value).toBe("all");
	});
});

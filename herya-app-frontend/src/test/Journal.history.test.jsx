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
import Journal from "./Journal";

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

const renderJournalWithNavigation = (initialEntry = "/journal") =>
	render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<Routes>
				<Route
					path="/journal"
					element={
						<>
							<Journal />
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

describe("Journal browser history navigation", () => {
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
		const view = renderJournalWithNavigation(
			"/journal?mood=calm&type=meditation",
		);
		const ui = within(view.container);

		await waitFor(() => {
			expect(vi.mocked(getJournalEntries)).toHaveBeenCalled();
		});

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("calm");
		expect(typeSelect.value).toBe("meditation");

		const search = ui.getByTestId("location-search").textContent;
		expect(search).toContain("mood=calm");
		expect(search).toContain("type=meditation");
	});

	it("preserves URL state after changing filters locally", async () => {
		const view = renderJournalWithNavigation("/journal?mood=calm");
		const ui = within(view.container);

		await waitFor(() => {
			expect(
				ui.getByPlaceholderText("Search insights/reflection"),
			).toBeTruthy();
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
	});

	it("restores complete state when navigating to a URL with encoded filters", async () => {
		const complexUrl =
			"/journal?mood=calm&from=2026-03-01&to=2026-03-31&preset=30&q=clear&type=meditation&entry=j1";
		const view = renderJournalWithNavigation(complexUrl);
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
		const view = renderJournalWithNavigation("/journal");
		const ui = within(view.container);

		await waitFor(() => {
			expect(
				ui.getByPlaceholderText("Search insights/reflection"),
			).toBeTruthy();
		});

		const searchInput = ui.getByPlaceholderText("Search insights/reflection");
		expect(searchInput.value).toBe("");

		const [moodSelect, typeSelect] = ui.getAllByRole("combobox");
		expect(moodSelect.value).toBe("all");
		expect(typeSelect.value).toBe("all");
	});
});

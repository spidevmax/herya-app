/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TutorInsightsCard from "../components/dashboard/TutorInsightsCard";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key, params = {}) => {
			const dict = {
				"dashboard.tutor_insights_title": "Tutor insights",
				"dashboard.tutor_insights_subtitle": "Snapshot",
				"dashboard.tutor_insights_empty": "No data",
				"dashboard.tutor_insights_sessions": "Tutor sessions",
				"dashboard.tutor_insights_pauses": "Safe pauses",
				"dashboard.tutor_insights_anchor_use": "Anchor usage",
				"dashboard.tutor_insights_signal_improved": "Signal improved",
				"dashboard.tutor_insights_signal_samples": `Samples: ${params.n ?? 0}`,
				"dashboard.tutor_insights_trend": `Trend: ${params.n ?? "0%"}`,
				"dashboard.tutor_insights_weekly_title": "Weekly trend",
				"dashboard.tutor_insights_weekly_current": `Current: ${params.n ?? 0}`,
				"dashboard.tutor_insights_weekly_previous": `Previous: ${params.n ?? 0}`,
				"dashboard.tutor_insights_weekly_delta_signal": `Signal delta: ${params.n ?? 0}`,
				"dashboard.tutor_insights_weekly_delta_anchor": `Anchor delta: ${params.n ?? 0}`,
				"dashboard.tutor_insights_weekly_delta_pauses": `Pause delta: ${params.n ?? 0}`,
				"dashboard.tutor_insights_reco_title": "Suggested next step",
				"dashboard.tutor_insights_reco_collect_more_data": "Collect more data",
				"dashboard.tutor_insights_reco_maintain_current_plan":
					"Maintain the current plan",
				"dashboard.tutor_insights_reco_switch_to_tutor":
					"Switch to the tutor plan",
				"dashboard.tutor_insights_confidence_high": "High confidence",
			};
			return dict[key] || key;
		},
	}),
}));

describe("TutorInsightsCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders the tutor recommendation with its confidence", async () => {
		const tutorInsights = {
			sessionCount: 4,
			totalSafePauses: 5,
			anchorUseRate: 30,
			signalImprovementRate: 35,
			signalTransitionsCount: 4,
			weeklyTrend: {
				currentWeek: { sessionCount: 2 },
				previousWeek: { sessionCount: 2 },
				delta: {
					signalImprovementRate: -10,
					anchorUseRate: -5,
					totalSafePauses: 1,
				},
			},
			recommendation: {
				key: "collect_more_data",
				severity: "info",
				preset: "tutor",
				confidence: "low",
			},
		};

		const { container } = render(
			<BrowserRouter>
				<TutorInsightsCard tutorInsights={tutorInsights} />
			</BrowserRouter>,
		);
		const ui = within(container);

		/*
		 * The "apply plan" buttons and their navigation were removed in a30c52a
		 * ("clean up recommendation handling"); the card now surfaces the
		 * recommendation as read-only text, which is what this asserts.
		 */
		expect(ui.getByText("Suggested next step")).toBeInTheDocument();
		expect(ui.getByText("Collect more data")).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("renders the adult recommendation with its confidence", async () => {
		const tutorInsights = {
			sessionCount: 4,
			totalSafePauses: 2,
			anchorUseRate: 75,
			signalImprovementRate: 82,
			signalTransitionsCount: 4,
			weeklyTrend: {
				currentWeek: { sessionCount: 3 },
				previousWeek: { sessionCount: 1 },
				delta: {
					signalImprovementRate: 12,
					anchorUseRate: 15,
					totalSafePauses: -1,
				},
			},
			recommendation: {
				key: "maintain_current_plan",
				severity: "success",
				preset: "adult",
				confidence: "high",
			},
		};

		const { container } = render(
			<BrowserRouter>
				<TutorInsightsCard tutorInsights={tutorInsights} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText("Suggested next step")).toBeInTheDocument();
		expect(ui.getByText("Maintain the current plan")).toBeInTheDocument();
		expect(ui.getByText("High confidence")).toBeInTheDocument();
		expect(mockNavigate).not.toHaveBeenCalled();
	});
});

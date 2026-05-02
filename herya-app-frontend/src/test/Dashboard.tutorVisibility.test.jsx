/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../pages/Dashboard";

const mockNavigate = vi.fn();
let mockUser = null;

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/api/sequences.api", () => ({
	getRecommendedSequence: () => Promise.resolve({ data: { data: null } }),
}));

vi.mock("@/api/sessions.api", () => ({
	getSessions: () => Promise.resolve({ data: { data: { sessions: [] } } }),
	getSessionStats: () =>
		Promise.resolve({
			data: {
				data: {
					currentStreak: 0,
					sessionsPerWeek: [0, 0, 0, 0],
					tutorInsights: { sessionCount: 2 },
				},
			},
		}),
}));

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key) => key,
	}),
}));

vi.mock("@/components/dashboard/CalendarStrip", () => ({
	default: () => <div data-testid="calendar-strip" />,
}));

vi.mock("@/components/dashboard/HeroCard", () => ({
	default: () => <div data-testid="hero-card" />,
}));

vi.mock("@/components/dashboard/SoftReminderCard", () => ({
	default: () => <div data-testid="soft-reminder-card" />,
}));

vi.mock("@/components/dashboard/RecentSessionCard", () => ({
	default: () => <div data-testid="recent-session-card" />,
}));

vi.mock("@/components/dashboard/TutorInsightsCard", () => ({
	default: () => <div data-testid="tutor-insights-card" />,
}));

vi.mock("@/components/ui", () => ({
	SkeletonCard: () => <div data-testid="skeleton-card" />,
	Button: ({ children, ...props }) => (
		<button type="button" {...props}>
			{children}
		</button>
	),
	LoadingSpinner: () => <div data-testid="loading-spinner" />,
	ConfirmModal: () => null,
	StickyHeader: ({ children }) => <div>{children}</div>,
}));

describe("Dashboard tutor visibility", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockNavigate.mockReset();
	});

	afterEach(() => {
		cleanup();
	});

	it("does not render tutor insights for non-tutor users", async () => {
		mockUser = {
			name: "Standard User",
			role: "user",
			preferences: { lowStimMode: false },
		};

		render(
			<BrowserRouter>
				<Dashboard />
			</BrowserRouter>,
		);

		await waitFor(() => {
			expect(
				screen.queryByTestId("tutor-insights-card"),
			).not.toBeInTheDocument();
		});
	});

	it("renders tutor insights for tutor users", async () => {
		mockUser = {
			name: "Tutor User",
			role: "tutor",
			preferences: { lowStimMode: true },
		};

		render(
			<BrowserRouter>
				<Dashboard />
			</BrowserRouter>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("tutor-insights-card")).toBeInTheDocument();
		});
	});
});

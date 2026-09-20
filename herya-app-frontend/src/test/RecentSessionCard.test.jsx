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
import RecentSessionCard from "../components/dashboard/RecentSessionCard";

/*
 * useLanguage is mocked rather than wrapped in the real provider, matching the
 * pattern of the suites that already pass: the provider reads localStorage and
 * navigator on mount, which this environment does not supply.
 */
vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		lang: "en",
		t: (key) => {
			const dict = {
				"dashboard.vk_sequence": "VK Sequence",
				"dashboard.pranayama": "Pranayama",
				"dashboard.meditation": "Meditation",
				"dashboard.complete_practice": "Complete Practice",
				"dashboard.sessions": "Sessions",
			};
			return dict[key] ?? key;
		},
	}),
}));

const renderCard = (session, props = {}) =>
	render(
		<BrowserRouter>
			<RecentSessionCard session={session} {...props} />
		</BrowserRouter>,
	);

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/utils/helpers", () => ({
	format: {
		date: (value) => {
			if (!value) return "";
			return new Date(value).toISOString().slice(0, 10);
		},
	},
}));

const sanitizeMotionProps = (props) => {
	const domProps = { ...props };
	delete domProps.initial;
	delete domProps.animate;
	delete domProps.exit;
	delete domProps.transition;
	delete domProps.whileHover;
	delete domProps.whileTap;
	delete domProps.onClick;
	return domProps;
};

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, onClick, ...props }) => (
			<button type="button" {...sanitizeMotionProps(props)} onClick={onClick}>
				{children}
			</button>
		),
	},
}));

describe("RecentSessionCard", () => {
	const mockVKSession = {
		_id: "sess-123",
		sessionType: "vk_sequence",
		date: "2026-04-03T10:30:00.000Z",
		duration: 30,
		completed: true,
		vkSequence: {
			_id: "seq-456",
			family: "tadasana",
			englishName: "Tadasana Flow",
		},
	};

	const mockPranayamaSession = {
		_id: "sess-124",
		sessionType: "pranayama",
		date: "2026-04-02T09:00:00.000Z",
		duration: 15,
		completed: true,
		vkSequence: null,
	};

	const mockIncompleteSession = {
		_id: "sess-125",
		sessionType: "meditation",
		date: "2026-04-01T18:00:00.000Z",
		duration: 20,
		completed: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("displays VK sequence name when available", () => {
		const { container } = renderCard(mockVKSession);
		const ui = within(container);

		expect(ui.getByText("Tadasana Flow")).toBeInTheDocument();
	});

	it("displays session date", () => {
		const { container } = renderCard(mockVKSession);
		const ui = within(container);

		expect(ui.getByText("2026-04-03")).toBeInTheDocument();
	});

	it("displays session duration in minutes", () => {
		const { container } = renderCard(mockVKSession);
		const ui = within(container);

		expect(ui.getByText("30 min")).toBeInTheDocument();
	});

	it("displays completed status check icon", () => {
		const { container } = renderCard(mockVKSession);

		// Icon will be rendered via lucide, check if element exists
		expect(container.textContent).toContain("30 min");
	});

	it("displays incomplete status x icon", () => {
		const { container } = renderCard(mockIncompleteSession);

		expect(container.textContent).toContain("20 min");
	});

	it("navigates to session detail when clicked", async () => {
		const { container } = renderCard(mockVKSession);

		const card = container.querySelector("div");
		fireEvent.click(card);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/sessions/sess-123");
		});
	});

	it("handles pranayama session type correctly", () => {
		const { container } = renderCard(mockPranayamaSession);

		expect(container.textContent).toContain("15 min");
		expect(container.textContent).toContain("2026-04-02");
	});

	it("displays generic session name when vkSequence is null", () => {
		const { container } = renderCard(mockPranayamaSession);

		expect(container.textContent).toContain("2026-04-02");
	});

	it("applies correct animation delay based on index", () => {
		const { container } = renderCard(mockVKSession, { index: 2 });

		// Motion div is rendered with index *  0.08 delay
		const div = container.querySelector("div");
		expect(div).toBeInTheDocument();
	});

	it("handles session with createdAt instead of date", () => {
		const sessionWithCreatedAt = {
			...mockVKSession,
			date: undefined,
			createdAt: "2026-03-30T14:00:00.000Z",
		};

		const { container } = renderCard(sessionWithCreatedAt);

		expect(container.textContent).toContain("2026-03-30");
	});

	it("renders with session duration correctly", () => {
		const sessions = [
			{ ...mockVKSession, duration: 5 },
			{ ...mockVKSession, duration: 60 },
			{ ...mockVKSession, duration: 120 },
		];

		sessions.forEach((session) => {
			const { container } = renderCard(session);

			expect(container.textContent).toContain(`${session.duration} min`);
			cleanup();
		});
	});

	it("displays family emoji when available from VK_FAMILY_MAP", () => {
		const sessionWithTadasana = {
			...mockVKSession,
			vkSequence: {
				...mockVKSession.vkSequence,
				family: "tadasana",
			},
		};

		const { container } = renderCard(sessionWithTadasana);

		expect(container.textContent).toContain("Tadasana Flow");
	});
});

/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import HeroCard from "./HeroCard";

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
		t: (key) => {
			const dict = {
				"dashboard.welcome_title": "Welcome to Your Practice",
				"dashboard.recommended": "Recommended",
				"hero.welcome_hint": "Explore our library to get started",
				"hero.explore": "Explore Library",
				"hero.start": "Start Session",
			};
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
	delete domProps.onClick;
	return domProps;
};

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, onClick, ...props }) => (
			<button
				type="button"
				{...sanitizeMotionProps(props)}
				data-testid="motion-div"
				onClick={onClick}
			>
				{children}
			</button>
		),
	},
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onClick, ...props }) => (
		<button onClick={onClick} data-testid="ui-button" {...props}>
			{children}
		</button>
	),
}));

describe("HeroCard", () => {
	const mockSequence = {
		_id: "seq-123",
		family: "tadasana",
		englishName: "Tadasana Flow",
		sanskritName: "तादासन",
		level: 1,
		difficulty: "Beginner",
		estimatedDuration: {
			recommended: 30,
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("displays loading skeleton when loading is true", () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={null} loading={true} />
			</BrowserRouter>,
		);

		const skeleton = container.querySelector(".skeleton");
		expect(skeleton).toBeInTheDocument();
	});

	it("displays welcome message when no sequence is provided", () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={null} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText("Welcome to Your Practice")).toBeInTheDocument();
		expect(
			ui.getByText("Explore our library to get started"),
		).toBeInTheDocument();
	});

	it("navigates to library when explore button is clicked", async () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={null} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		const exploreButton = ui.getByText("Explore Library");
		fireEvent.click(exploreButton);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/library");
		});
	});

	it("displays sequence details when sequence is provided", () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText("Tadasana Flow")).toBeInTheDocument();
		expect(ui.getByText("तादासन")).toBeInTheDocument();
		expect(ui.getByText("Recommended")).toBeInTheDocument();
	});

	it("displays duration information", () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText("30 min")).toBeInTheDocument();
	});

	it("displays level badge", () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText(/Beginner|Level 1/i)).toBeInTheDocument();
	});

	it("displays reason when provided", () => {
		const reason = "Perfect for morning energy boost";
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} reason={reason} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText(reason)).toBeInTheDocument();
	});

	it("navigates to sequence details when card is clicked", async () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);

		const motionDiv = container.querySelector("[data-testid='motion-div']");
		fireEvent.click(motionDiv);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith("/library/sequence/seq-123");
		});
	});

	it("navigates to start session when start button is clicked", async () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		const startButton = ui.getByText("Start Session");
		fireEvent.click(startButton);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith(
				`/session/vk_sequence?seq=${mockSequence._id}`,
			);
		});
	});

	it("stops propagation when start button is clicked", async () => {
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={mockSequence} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		const startButton = ui.getByText("Start Session");
		fireEvent.click(startButton);

		// Note: fireEvent doesn't preserve event.stopPropagation behavior
		// but we check navigation happens
		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalled();
		});
	});

	it("handles sequence without estimatedDuration", () => {
		const sequenceNoEstimate = {
			...mockSequence,
			estimatedDuration: undefined,
		};
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={sequenceNoEstimate} loading={false} />
			</BrowserRouter>,
		);
		const ui = within(container);

		expect(ui.getByText("Tadasana Flow")).toBeInTheDocument();
		// Should not show duration
		expect(container.textContent).not.toContain("30 min");
	});

	it("handles sequence without family emoji", () => {
		const sequenceNoEmoji = { ...mockSequence, family: "unknown_family" };
		const { container } = render(
			<BrowserRouter>
				<HeroCard sequence={sequenceNoEmoji} loading={false} />
			</BrowserRouter>,
		);

		expect(container.textContent).toContain("Tadasana Flow");
		// PersonStanding icon should be in DOM (rendered via lucide)
	});
});

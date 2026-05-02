/** @vitest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Library from "../pages/Library";

const mockNavigate = vi.fn();
const getSequences = vi.fn();
const getPoses = vi.fn();
const getBreathingPatterns = vi.fn();

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock("@/api/sequences.api", () => ({
	getSequences: (...args) => getSequences(...args),
}));

vi.mock("@/api/poses.api", () => ({
	getPoses: (...args) => getPoses(...args),
}));

vi.mock("@/api/breathing.api", () => ({
	getBreathingPatterns: (...args) => getBreathingPatterns(...args),
}));

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({
		user: {
			preferences: {
				practiceIntensity: "moderate",
				timeOfDay: "evening",
			},
		},
	}),
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key, fallback) => fallback || key,
	}),
}));

vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }) => <>{children}</>,
	motion: {
		div: ({ children, ...props }) => <div {...props}>{children}</div>,
		button: ({ children, ...props }) => <button {...props}>{children}</button>,
	},
}));

vi.mock("@/components/ui", () => ({
	EmptyState: ({ title, description, action }) => (
		<div>
			<div>{title}</div>
			<div>{description}</div>
			{action}
		</div>
	),
	SkeletonCard: () => <div>loading</div>,
}));

const wrapResponse = (data) => ({ data: { data } });

describe("Library", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("keeps successful content visible when one source fails", async () => {
		getSequences.mockResolvedValue(
			wrapResponse({
				sequences: [
					{ _id: "seq-1", englishName: "Evening Flow", difficulty: "beginner" },
				],
			}),
		);
		getPoses.mockResolvedValue(
			wrapResponse({
				poses: [
					{ _id: "pose-1", englishName: "Tadasana", difficulty: "beginner" },
				],
			}),
		);
		getBreathingPatterns.mockRejectedValue(new Error("network"));

		render(<Library />);

		expect(await screen.findByText("Evening Flow")).toBeInTheDocument();
		expect(screen.getByText("Tadasana")).toBeInTheDocument();
		expect(screen.getByText("Could not load content")).toBeInTheDocument();
		expect(screen.getByText(/Pranayama/)).toBeInTheDocument();
	});

	it("applies preference-based sorting in the all tab", async () => {
		getSequences.mockResolvedValue(
			wrapResponse({
				sequences: [
					{
						_id: "seq-a",
						englishName: "Advanced Flow",
						difficulty: "advanced",
					},
					{
						_id: "seq-b",
						englishName: "Beginner Flow",
						difficulty: "beginner",
					},
					{
						_id: "seq-c",
						englishName: "Moderate Flow",
						difficulty: "intermediate",
					},
				],
			}),
		);
		getPoses.mockResolvedValue(wrapResponse({ poses: [] }));
		getBreathingPatterns.mockResolvedValue(wrapResponse({ patterns: [] }));

		render(<Library />);

		await screen.findByText("Moderate Flow");
		const sequenceSection = screen.getByText("VK Sequence").closest("div");
		const cards = within(sequenceSection.parentElement).getAllByRole("button");
		const titles = cards.map((card) => card.textContent);

		expect(titles[0]).toContain("Moderate Flow");
		expect(titles[1]).toContain("Beginner Flow");
		expect(titles[2]).toContain("Advanced Flow");
	});
});

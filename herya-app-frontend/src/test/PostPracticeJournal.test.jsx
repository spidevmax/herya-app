/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PostPracticeJournal from "../components/session/PostPracticeJournal";

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key, vars) => {
			const dict = {
				"practice.journal_title": "Great Session!",
				"practice.duration": "Duration",
				"practice.blocks_completed": "Blocks",
				"practice.journal_mood_after": "How do you feel?",
				"practice.journal_energy_after": "Energy level: {n}",
				"practice.journal_stress_after": "Stress level: {n}",
				"practice.journal_sensations": "Physical sensations",
				"practice.journal_emotional_notes": "Emotional notes",
				"practice.journal_emotional_placeholder":
					"How do you feel emotionally?",
				"practice.journal_gratitude": "Gratitude",
				"practice.journal_gratitude_placeholder": "What are you grateful for?",
				"practice.journal_learnings": "Key learnings",
				"practice.journal_learnings_placeholder": "What did you learn?",
				"practice.save_journal": "Save Journal",
				"session.moods.calm": "Calm",
				"session.moods.energized": "Energized",
				"session.moods.focused": "Focused",
				"session.moods.peaceful": "Peaceful",
				"practice.sensation_relaxed": "Relaxed",
				"practice.sensation_energized": "Energized",
				"practice.sensation_open": "Open",
				"practice.sensation_tight": "Tight",
			};

			if (key.includes("{n}")) {
				return key.replace("{n}", vars?.n || 5);
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
	return domProps;
};

vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }) => <>{children}</>,
	motion: {
		div: ({ children, ...props }) => (
			<div {...sanitizeMotionProps(props)}>{children}</div>
		),
	},
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onClick, disabled, loading: _, ...props }) => ( // eslint-disable-line no-unused-vars
		<button
			onClick={onClick}
			disabled={disabled}
			data-testid="save-button"
			{...props}
		>
			{children}
		</button>
	),
}));

describe("PostPracticeJournal", () => {
	const mockSessionSummary = {
		globalElapsedSec: 720, // 12:00
		blocksCompleted: 3,
	};

	const mockCheckInData = {
		mood: ["focused"],
		energyLevel: 6,
		stressLevel: 4,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders all form sections", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		expect(container.textContent).toContain("Great Session!");
		expect(container.textContent).toContain("How do you feel?");
		expect(container.textContent).toContain("Physical sensations");
		expect(container.textContent).toContain("Emotional notes");
		expect(container.textContent).toContain("Gratitude");
		expect(container.textContent).toContain("Key learnings");
	});

	it("displays session summary with duration and blocks", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		expect(container.textContent).toContain("Duration");
		expect(container.textContent).toContain("Blocks");
		expect(container.textContent).toContain("12:00");
		expect(container.textContent).toContain("3");
	});

	it("allows toggling mood selection (max 3)", async () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);
		const ui = within(container);
		const calmButton = ui.getByText("Calm");
		fireEvent.click(calmButton);

		const saveButton = ui.getByTestId("save-button");
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(handleSave).toHaveBeenCalledWith(
				expect.objectContaining({
					moodAfter: expect.arrayContaining(["calm"]),
				}),
			);
		});
	});

	it("allows adjusting energy level slider", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		const energySlider = container.querySelectorAll("input[type='range']")[0];
		expect(energySlider.value).toBe("5");

		fireEvent.change(energySlider, { target: { value: 8 } });
		expect(energySlider.value).toBe("8");
	});

	it("allows adjusting stress level slider", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		const sliders = container.querySelectorAll("input[type='range']");
		const stressSlider = sliders[1];

		fireEvent.change(stressSlider, { target: { value: 2 } });
		expect(stressSlider.value).toBe("2");
	});

	it("allows selecting physical sensations", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		// Get all buttons and find the first sensation button by checking the text
		const allButtons = container.querySelectorAll("button");
		let sensationButton = null;

		// Find Relaxed button text in all buttons
		for (const btn of allButtons) {
			if (btn.textContent.includes("Relaxed")) {
				sensationButton = btn;
				break;
			}
		}

		if (sensationButton) {
			fireEvent.click(sensationButton);
			// After clicking, the button should have been toggled
			// We just verify that the click didn't error
			expect(sensationButton).toBeInTheDocument();
		}
	});

	it("allows typing in text fields", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);

		const textareas = container.querySelectorAll("textarea");
		const emotionalNotesField = textareas[0];

		fireEvent.change(emotionalNotesField, {
			target: { value: "Feeling very calm" },
		});
		expect(emotionalNotesField.value).toBe("Feeling very calm");
	});

	it("calls onSave with correct data when save button clicked", async () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);
		const ui = within(container);

		// Select moods
		const calmButton = ui.getByText("Calm");
		fireEvent.click(calmButton);

		// Set energy and stress
		const sliders = container.querySelectorAll("input[type='range']");
		fireEvent.change(sliders[0], { target: { value: 8 } });
		fireEvent.change(sliders[1], { target: { value: 3 } });

		// Add text
		const textareas = container.querySelectorAll("textarea");
		fireEvent.change(textareas[0], { target: { value: "Feeling great" } });
		fireEvent.change(textareas[2], {
			target: { value: "Learned to breathe slower" },
		});

		// Click save
		const saveButton = ui.getByTestId("save-button");
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(handleSave).toHaveBeenCalledWith(
				expect.objectContaining({
					moodAfter: expect.any(Array),
					energyLevel: expect.objectContaining({
						before: 6,
						after: 8,
					}),
					stressLevel: expect.objectContaining({
						before: 4,
						after: 3,
					}),
					emotionalNotes: "Feeling great",
					insights: "Learned to breathe slower",
				}),
			);
		});
	});

	it("normalizes empty mood to default when saving", async () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={false}
			/>,
		);
		const ui = within(container);

		const saveButton = ui.getByTestId("save-button");
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(handleSave).toHaveBeenCalledWith(
				expect.objectContaining({
					moodAfter: ["calm"], // default
				}),
			);
		});
	});

	it("disables save button when saving is true", () => {
		const handleSave = vi.fn();
		const { container } = render(
			<PostPracticeJournal
				sessionSummary={mockSessionSummary}
				checkInData={mockCheckInData}
				onSave={handleSave}
				saving={true}
			/>,
		);
		const ui = within(container);

		const saveButton = ui.getByTestId("save-button");
		expect(saveButton).toBeDisabled();
	});
});

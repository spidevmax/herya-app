/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	waitFor,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PracticeTypeSelector from "../components/session/PracticeTypeSelector";

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key) => {
			const dict = {
				"practice.select_type_title": "Choose Your Practice",
				"practice.select_type_subtitle":
					"Select what you want to practice today",
				"practice.type_vk_sequence": "VK Sequence",
				"practice.type_vk_sequence_desc": "Vinyasa Krama poses",
				"practice.type_pranayama": "Breathing",
				"practice.type_pranayama_desc": "Breathwork techniques",
				"practice.type_meditation": "Meditation",
				"practice.type_meditation_desc": "Mindfulness practice",
				"practice.type_complete_practice": "Complete Practice",
				"practice.type_complete_practice_desc": "Full session",
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
	return domProps;
};

vi.mock("framer-motion", () => ({
	motion: {
		button: ({ children, ...props }) => (
			<button {...sanitizeMotionProps(props)}>{children}</button>
		),
	},
}));

describe("PracticeTypeSelector", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders all practice type buttons", () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);
		const ui = within(container);

		expect(ui.getByText("VK Sequence")).toBeInTheDocument();
		expect(ui.getByText("Breathing")).toBeInTheDocument();
		expect(ui.getByText("Meditation")).toBeInTheDocument();
		expect(ui.getByText("Complete Practice")).toBeInTheDocument();
	});

	it("displays title and subtitle", () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);
		const ui = within(container);

		expect(ui.getByText("Choose Your Practice")).toBeInTheDocument();
		expect(
			ui.getByText("Select what you want to practice today"),
		).toBeInTheDocument();
	});

	it("calls onSelect callback when button is clicked", async () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);
		const ui = within(container);

		const vkButton = ui.getByText("VK Sequence").closest("button");
		fireEvent.click(vkButton);

		await waitFor(() => {
			expect(handleSelect).toHaveBeenCalledWith("vk_sequence");
		});
	});

	it("calls onSelect with correct practice type for each button", async () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);
		const ui = within(container);

		const practiceTypes = [
			{ label: "VK Sequence", value: "vk_sequence" },
			{ label: "Breathing", value: "pranayama" },
			{ label: "Meditation", value: "meditation" },
			{ label: "Complete Practice", value: "complete_practice" },
		];

		for (const { label, value } of practiceTypes) {
			handleSelect.mockClear();
			const button = ui.getByText(label).closest("button");
			fireEvent.click(button);

			await waitFor(() => {
				expect(handleSelect).toHaveBeenCalledWith(value);
			});
		}
	});

	it("renders description text for each practice type", () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);
		const ui = within(container);

		expect(ui.getByText("Vinyasa Krama poses")).toBeInTheDocument();
		expect(ui.getByText("Breathwork techniques")).toBeInTheDocument();
		expect(ui.getByText("Mindfulness practice")).toBeInTheDocument();
		expect(ui.getByText("Full session")).toBeInTheDocument();
	});

	it("renders 4 practice type buttons", () => {
		const handleSelect = vi.fn();
		const { container } = render(
			<PracticeTypeSelector onSelect={handleSelect} />,
		);

		const buttons = container.querySelectorAll("button");
		expect(buttons.length).toBe(4);
	});
});

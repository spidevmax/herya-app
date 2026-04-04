/** @vitest-environment jsdom */
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StartPractice from "./StartPractice";

let mockUser = null;

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({
		user: mockUser,
		refreshUser: vi.fn().mockResolvedValue(undefined),
	}),
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		t: (key) => {
			const dict = {
				"practice.start_practice": "Start practice",
				"practice.build_session": "Build session",
				"practice.check_in": "Check-in",
				"practice.in_progress": "In progress",
				"practice.journal": "Journal",
				"practice.tutor_support_title": "Tutor mode",
				"practice.tutor_support_subtitle": "Tutor support subtitle",
				"practice.preset_adult": "Adult start",
				"practice.preset_tutor": "Tutor + child",
				"practice.low_stim_mode": "Low stimulation",
				"practice.preset_tutor_hint": "Tutor hint",
				"practice.low_stim_mode_hint": "Low stim hint",
				"practice.reco_title": "Recommendation",
				"practice.reco_apply": "Apply",
			};
			return dict[key] || key;
		},
	}),
}));

vi.mock("@/hooks/useSessionPersistence", () => ({
	default: () => ({
		recovered: null,
		saveSession: vi.fn(),
		clearSession: vi.fn(),
		dismissRecovery: vi.fn(),
	}),
}));

vi.mock("@/api/journalEntries.api", () => ({
	createJournalEntry: vi.fn(),
	getJournalEntries: vi.fn().mockResolvedValue({
		data: {
			data: {
				journals: [
					{
						signalAfter: "red",
						stressLevel: { after: 8 },
					},
				],
			},
		},
	}),
}));

vi.mock("@/api/sessions.api", () => ({
	createSession: vi.fn(),
	startSessionTimer: vi.fn(),
	completeGuidedSession: vi.fn(),
	abandonSession: vi.fn(),
}));

vi.mock("@/api/sequences.api", () => ({
	getSequenceById: vi.fn(),
}));

vi.mock("@/api/breathing.api", () => ({
	getBreathingPatternById: vi.fn(),
}));

vi.mock("framer-motion", () => ({
	AnimatePresence: ({ children }) => <>{children}</>,
	motion: {
		div: ({ children, ...props }) => <div {...props}>{children}</div>,
	},
}));

vi.mock("@/components/session/PracticeTypeSelector", () => ({
	default: ({ onSelect }) => (
		<button type="button" onClick={() => onSelect("vk_sequence")}>
			Select VK
		</button>
	),
}));

vi.mock("@/components/session/SessionBuilder", () => ({
	default: () => <div>Session builder</div>,
}));

vi.mock("@/components/session/GuidedPracticePlayer", () => ({
	default: () => <div>Guided player</div>,
}));

vi.mock("@/components/session/PostPracticeJournal", () => ({
	default: () => <div>Post journal</div>,
}));

vi.mock("@/components/ui", () => ({
	Button: ({ children, onClick }) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

const renderStartPractice = ({ role, routeState } = {}) => {
	mockUser = {
		role: role || "user",
		preferences: { lowStimMode: false },
	};

	return render(
		<MemoryRouter
			initialEntries={[
				{ pathname: "/start-practice", state: routeState || undefined },
			]}
		>
			<Routes>
				<Route path="/start-practice" element={<StartPractice />} />
			</Routes>
		</MemoryRouter>,
	);
};

describe("StartPractice role gating", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("hides tutor preset for non-tutor users", async () => {
		renderStartPractice({ role: "user" });

		fireEvent.click(screen.getByRole("button", { name: "Select VK" }));

		await waitFor(() => {
			expect(screen.getByText("Adult start")).toBeInTheDocument();
			expect(screen.queryByText("Tutor + child")).not.toBeInTheDocument();
			expect(screen.getByText("Low stim hint")).toBeInTheDocument();
		});
	});

	it("ignores suggested tutor preset for non-tutor users", async () => {
		renderStartPractice({
			role: "user",
			routeState: { suggestedPreset: "tutor" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Select VK" }));

		await waitFor(() => {
			expect(screen.queryByText("Tutor + child")).not.toBeInTheDocument();
			expect(screen.getByText("Low stim hint")).toBeInTheDocument();
			expect(screen.queryByText("Tutor hint")).not.toBeInTheDocument();
		});
	});

	it("applies suggested tutor preset for tutor users", async () => {
		renderStartPractice({
			role: "tutor",
			routeState: { suggestedPreset: "tutor" },
		});

		fireEvent.click(screen.getByRole("button", { name: "Select VK" }));

		await waitFor(() => {
			expect(screen.getByText("Tutor + child")).toBeInTheDocument();
			expect(screen.getByText("Tutor hint")).toBeInTheDocument();
		});
	});
});

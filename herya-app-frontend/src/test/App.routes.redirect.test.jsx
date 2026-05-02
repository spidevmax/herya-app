/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppRoutes from "@/App";

let mockUser = { role: "user", preferences: {} };
let mockLoading = false;

vi.mock("@/context/AuthContext", () => ({
	useAuth: () => ({
		user: mockUser,
		loading: mockLoading,
	}),
}));

vi.mock("@/context/LanguageContext", () => ({
	useLanguage: () => ({
		lang: "en",
		setLanguage: vi.fn(),
	}),
}));

vi.mock("@/context/ThemeContext", () => ({
	useTheme: () => ({
		setTheme: vi.fn(),
	}),
}));

vi.mock("@/components/layout/AppLayout", () => ({
	default: () => <Outlet />,
}));

vi.mock("@/components/ui", () => ({
	LoadingSpinner: () => <div>loading</div>,
}));

vi.mock("@/pages/AuthCallback", () => ({
	default: () => <div>AuthCallback</div>,
}));
vi.mock("@/pages/Login", () => ({ default: () => <div>Login</div> }));
vi.mock("@/pages/ForgotPassword", () => ({
	default: () => <div>ForgotPassword</div>,
}));
vi.mock("@/pages/Register", () => ({ default: () => <div>Register</div> }));
vi.mock("@/pages/ResetPassword", () => ({
	default: () => <div>ResetPassword</div>,
}));
vi.mock("@/pages/Dashboard", () => ({ default: () => <div>Dashboard</div> }));
vi.mock("@/pages/Library", () => ({ default: () => <div>Library</div> }));
vi.mock("@/pages/SequenceDetail", () => ({
	default: () => <div>SequenceDetail</div>,
}));
vi.mock("@/pages/PoseDetail", () => ({ default: () => <div>PoseDetail</div> }));
vi.mock("@/pages/BreathingDetail", () => ({
	default: () => <div>BreathingDetail</div>,
}));
vi.mock("@/pages/Poses", () => ({ default: () => <div>Poses</div> }));
vi.mock("@/pages/StartPractice", () => ({
	default: () => <div>StartPractice</div>,
}));
vi.mock("@/pages/Session", () => ({ default: () => <div>Session</div> }));
vi.mock("@/pages/SessionHistory", () => ({
	default: () => <div>SessionHistory</div>,
}));
vi.mock("@/pages/SessionDetail", () => ({
	default: () => <div>SessionDetail</div>,
}));
vi.mock("@/pages/Journal", () => ({ default: () => <div>Journal</div> }));
vi.mock("@/pages/JournalForm", () => ({
	default: () => <div>JournalForm</div>,
}));
vi.mock("@/pages/Profile", () => ({ default: () => <div>Profile</div> }));
vi.mock("@/pages/Admin", () => ({ default: () => <div>Admin</div> }));
vi.mock("@/pages/NotFound", () => ({ default: () => <div>NotFound</div> }));

const LocationProbe = () => {
	const location = useLocation();
	return <div data-testid="pathname">{location.pathname}</div>;
};

afterEach(() => {
	mockUser = { role: "user", preferences: {} };
	mockLoading = false;
});

describe("App routes redirects", () => {
	it("redirects /garden to /journal for authenticated users", async () => {
		render(
			<MemoryRouter initialEntries={["/garden"]}>
				<AppRoutes />
				<LocationProbe />
			</MemoryRouter>,
		);

		expect(await screen.findByText("Journal")).toBeInTheDocument();
		expect(screen.getByTestId("pathname")).toHaveTextContent("/journal");
	});
});

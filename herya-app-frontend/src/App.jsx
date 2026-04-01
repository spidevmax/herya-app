import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";
import BreathingDetail from "./pages/BreathingDetail";
import Dashboard from "./pages/Dashboard";
import Garden from "./pages/Garden";
import Library from "./pages/Library";
import Login from "./pages/Login";
import PoseDetail from "./pages/PoseDetail";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import SequenceDetail from "./pages/SequenceDetail";
import Session from "./pages/Session";
import SessionDetail from "./pages/SessionDetail";

/** Syncs language and theme from user.preferences after login */
function SyncUserPreferences() {
	const { user } = useAuth();
	const { lang, setLanguage } = useLanguage();
	const { setTheme } = useTheme();

	useEffect(() => {
		if (!user?.preferences) return;
		const prefLang = user.preferences.language;
		if (prefLang && prefLang !== lang) setLanguage(prefLang);
		const prefTheme = user.preferences.theme;
		if (prefTheme) setTheme(prefTheme);
	}, [user, lang, setLanguage, setTheme]);

	return null;
}

function ProtectedRoute({ children }) {
	const { user, loading } = useAuth();
	if (loading)
		return (
			<div className="min-h-dvh flex items-center justify-center">
				<div
					className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
					style={{
						borderColor:
							"var(--color-primary) var(--color-border) var(--color-border) var(--color-border)",
					}}
				/>
			</div>
		);
	return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
	const { user, loading } = useAuth();
	if (loading)
		return (
			<div className="min-h-dvh flex items-center justify-center">
				<div
					className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
					style={{
						borderColor:
							"var(--color-primary) var(--color-border) var(--color-border) var(--color-border)",
					}}
				/>
			</div>
		);
	return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
	return (
		<>
			<SyncUserPreferences />
			<Routes>
				<Route
					path="/login"
					element={
						<PublicRoute>
							<Login />
						</PublicRoute>
					}
				/>
				<Route
					path="/register"
					element={
						<PublicRoute>
							<Register />
						</PublicRoute>
					}
				/>
				<Route
					element={
						<ProtectedRoute>
							<AppLayout />
						</ProtectedRoute>
					}
				>
					<Route path="/" element={<Dashboard />} />
					<Route path="/library" element={<Library />} />
					<Route path="/library/sequence/:id" element={<SequenceDetail />} />
					<Route path="/poses/:id" element={<PoseDetail />} />
					<Route path="/breathing/:id" element={<BreathingDetail />} />
					<Route path="/sessions/:id" element={<SessionDetail />} />
					<Route path="/garden" element={<Garden />} />
					<Route path="/session/:type" element={<Session />} />
					<Route path="/profile" element={<Profile />} />
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	);
}

export default function App() {
	return (
		<ThemeProvider>
			<LanguageProvider>
				<AuthProvider>
					<BrowserRouter>
						<AppRoutes />
					</BrowserRouter>
				</AuthProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

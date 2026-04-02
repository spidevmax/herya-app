import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import AppLayout from "@/components/layout/AppLayout";
import {
	AdminRoute,
	ProtectedRoute,
	PublicRoute,
} from "@/components/routing/RouteGuards";
import Admin from "@/pages/Admin";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import ForgotPassword from "@/pages/ForgotPassword";
import Garden from "@/pages/Garden";
import Journal from "@/pages/Journal";
import JournalForm from "@/pages/JournalForm";
import Library from "@/pages/Library";
import Login from "@/pages/Login";
import PoseDetail from "@/pages/PoseDetail";
import Poses from "@/pages/Poses";
import Profile from "@/pages/Profile";
import Register from "@/pages/Register";
import ResetPassword from "@/pages/ResetPassword";
import SequenceDetail from "@/pages/SequenceDetail";
import Session from "@/pages/Session";
import SessionDetail from "@/pages/SessionDetail";
import SessionHistory from "@/pages/SessionHistory";

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

const AppRoutes = () => {
	return (
		<>
			<SyncUserPreferences />
			<Routes>
				<Route path="/auth/callback" element={<AuthCallback />} />
				<Route
					path="/login"
					element={
						<PublicRoute>
							<Login />
						</PublicRoute>
					}
				/>
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route
					path="/register"
					element={
						<PublicRoute>
							<Register />
						</PublicRoute>
					}
				/>
				<Route path="/reset-password" element={<ResetPassword />} />

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
					<Route path="/poses" element={<Poses />} />
					<Route path="/poses/:id" element={<PoseDetail />} />

					<Route path="/session/:type" element={<Session />} />
					<Route path="/sessions" element={<SessionHistory />} />
					<Route path="/sessions/:id" element={<SessionDetail />} />

					<Route path="/garden" element={<Garden />} />
					<Route path="/journal" element={<Journal />} />
					<Route path="/journal/new" element={<JournalForm />} />
					<Route path="/journal/:id/edit" element={<JournalForm />} />

					<Route path="/profile" element={<Profile />} />
				</Route>

				<Route
					path="/admin"
					element={
						<AdminRoute>
							<AppLayout />
						</AdminRoute>
					}
				>
					<Route index element={<Admin />} />
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</>
	);
};

export default AppRoutes;

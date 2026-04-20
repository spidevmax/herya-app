import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import {
	AdminRoute,
	ProtectedRoute,
	PublicRoute,
} from "@/components/routing/RouteGuards";
import { LoadingSpinner } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

const Admin = lazy(() => import("@/pages/Admin"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Journal = lazy(() => import("@/pages/Journal"));
const JournalForm = lazy(() => import("@/pages/JournalForm"));
const BreathingDetail = lazy(() => import("@/pages/BreathingDetail"));
const Library = lazy(() => import("@/pages/Library"));
const Login = lazy(() => import("@/pages/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PoseDetail = lazy(() => import("@/pages/PoseDetail"));
const Poses = lazy(() => import("@/pages/Poses"));
const Profile = lazy(() => import("@/pages/Profile"));
const Register = lazy(() => import("@/pages/Register"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SequenceDetail = lazy(() => import("@/pages/SequenceDetail"));
const Session = lazy(() => import("@/pages/Session"));
const StartPractice = lazy(() => import("@/pages/StartPractice"));
const SessionDetail = lazy(() => import("@/pages/SessionDetail"));
const SessionHistory = lazy(() => import("@/pages/SessionHistory"));

const prefetchDashboardRoutes = (role) => {
	void import("@/pages/Dashboard");
	void import("@/pages/Journal");

	if (role === "tutor") {
		void import("@/pages/StartPractice");
		return;
	}

	void import("@/pages/Library");
};

/** Syncs language and theme from user.preferences after login */
function SyncUserPreferences() {
	const { user } = useAuth();
	const { lang, setLanguage } = useLanguage();
	const { setTheme } = useTheme();

	useEffect(() => {
		if (!user?.preferences) return;
		const prefLang = user.preferences.language;
		if (prefLang && prefLang !== lang && ["es", "en"].includes(prefLang))
			setLanguage(prefLang);
		const prefTheme = user.preferences.theme;
		if (prefTheme && ["light", "dark"].includes(prefTheme)) setTheme(prefTheme);
	}, [user, lang, setLanguage, setTheme]);

	return null;
}

function PrefetchLikelyRoutes() {
	const { user, loading } = useAuth();

	useEffect(() => {
		if (loading || !user) return undefined;

		const schedulePrefetch = () => prefetchDashboardRoutes(user.role);
		const idleCallbackId =
			typeof window !== "undefined" && "requestIdleCallback" in window
				? window.requestIdleCallback(schedulePrefetch)
				: window.setTimeout(schedulePrefetch, 0);

		return () => {
			if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
				window.cancelIdleCallback(idleCallbackId);
				return;
			}

			window.clearTimeout(idleCallbackId);
		};
	}, [loading, user]);

	return null;
}

function LegacyPoseDetailRedirect() {
	const { id } = useParams();
	return <Navigate replace to={`/library/pose/${id}`} />;
}

function LegacyBreathingDetailRedirect() {
	const { id } = useParams();
	return <Navigate replace to={`/library/breathing/${id}`} />;
}

import { useAuth } from "@/context/AuthContext";

const AppRoutes = () => {
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";
	return (
		<>
			<SyncUserPreferences />
			<PrefetchLikelyRoutes />
			<Suspense
				fallback={
					<div className="min-h-dvh flex items-center justify-center">
						<LoadingSpinner size={40} color="var(--color-primary)" />
					</div>
				}
			>
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
						<Route path="/" element={isAdmin ? <Admin /> : <Dashboard />} />

						<Route path="/library" element={<Library />} />
						<Route path="/library/sequence/:id" element={<SequenceDetail />} />
						<Route path="/library/pose/:id" element={<PoseDetail />} />
						<Route
							path="/library/breathing/:id"
							element={<BreathingDetail />}
						/>
						{!isAdmin && <Route path="/poses" element={<Poses />} />}
						{!isAdmin && (
							<Route path="/poses/:id" element={<LegacyPoseDetailRedirect />} />
						)}
						{!isAdmin && (
							<Route
								path="/breathing/:id"
								element={<LegacyBreathingDetailRedirect />}
							/>
						)}

						{!isAdmin && (
							<Route path="/start-practice" element={<StartPractice />} />
						)}
						{!isAdmin && <Route path="/session/:type" element={<Session />} />}
						{!isAdmin && <Route path="/sessions" element={<SessionHistory />} />}
						{!isAdmin && (
							<Route path="/sessions/:id" element={<SessionDetail />} />
						)}

						{!isAdmin && <Route path="/journal" element={<Journal />} />}
						{!isAdmin && (
							<Route
								path="/garden"
								element={<Navigate replace to="/journal" />}
							/>
						)}
						{!isAdmin && (
							<Route path="/journal/new" element={<JournalForm />} />
						)}
						{!isAdmin && (
							<Route path="/journal/:id/edit" element={<JournalForm />} />
						)}

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
						<Route index element={<Navigate replace to="/" />} />
					</Route>

					<Route path="*" element={<NotFound />} />
				</Routes>
			</Suspense>
		</>
	);
};

export default AppRoutes;

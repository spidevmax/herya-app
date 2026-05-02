import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

const FullPageSpinner = () => (
	<div
		role="status"
		aria-live="polite"
		className="min-h-dvh flex items-center justify-center"
	>
		<LoadingSpinner size={40} color="var(--color-primary)" />
	</div>
);

export const ProtectedRoute = ({ children }) => {
	const { user, loading } = useAuth();
	if (loading) return <FullPageSpinner />;
	return user ? children : <Navigate to="/login" replace />;
};

export const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();
	if (loading) return <FullPageSpinner />;
	return user ? <Navigate to="/" replace /> : children;
};

export const AdminRoute = ({ children }) => {
	const { user, loading } = useAuth();
	if (loading) return <FullPageSpinner />;
	if (!user) return <Navigate to="/login" replace />;
	if (user.role !== "admin") return <Navigate to="/" replace />;
	return children;
};

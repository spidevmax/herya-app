import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import SequenceDetail from "./pages/SequenceDetail";
import Garden from "./pages/Garden";
import Session from "./pages/Session";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-dvh flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#4A72FF] border-t-transparent animate-spin" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-dvh flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-[#4A72FF] border-t-transparent animate-spin" /></div>;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/sequence/:id" element={<SequenceDetail />} />
        <Route path="/garden" element={<Garden />} />
        <Route path="/session/:type" element={<Session />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

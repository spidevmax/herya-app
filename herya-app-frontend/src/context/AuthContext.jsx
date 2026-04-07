import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import * as authApi from "@/api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(() => {
		try {
			const stored = localStorage.getItem("herya_user");
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	});
	const [loading, setLoading] = useState(true);

	const fetchMe = useCallback(async () => {
		try {
			const { data } = await authApi.getMe();
			const u = data.data || data;
			setUser(u);
			localStorage.setItem("herya_user", JSON.stringify(u));
		} catch {
			setUser(null);
			localStorage.removeItem("herya_user");
			localStorage.removeItem("herya_token");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const token = localStorage.getItem("herya_token");
		if (token) fetchMe();
		else setLoading(false);
	}, [fetchMe]);

	// Listen for 401 events from the axios interceptor
	useEffect(() => {
		const handleUnauthorized = () => setUser(null);
		window.addEventListener("herya:unauthorized", handleUnauthorized);
		return () =>
			window.removeEventListener("herya:unauthorized", handleUnauthorized);
	}, []);

	const login = async (credentials) => {
		const { data } = await authApi.login(credentials);
		const { token, user: u } = data.data || data;
		localStorage.setItem("herya_token", token);
		localStorage.setItem("herya_user", JSON.stringify(u));
		setUser(u);
		return u;
	};

	const register = async (payload) => {
		const { data } = await authApi.register(payload);
		const { token, user: u } = data.data || data;
		localStorage.setItem("herya_token", token);
		localStorage.setItem("herya_user", JSON.stringify(u));
		setUser(u);
		return u;
	};

	const loginWithToken = async (token) => {
		localStorage.setItem("herya_token", token);
		await fetchMe();
	};

	const logout = async () => {
		try {
			await authApi.logout();
		} catch {
			/* ignore */
		}
		localStorage.removeItem("herya_token");
		localStorage.removeItem("herya_user");
		setUser(null);
	};

	const refreshUser = () => fetchMe();

	const updateUser = (nextUser) => {
		setUser(nextUser);
		localStorage.setItem("herya_user", JSON.stringify(nextUser));
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				loginWithToken,
				register,
				logout,
				refreshUser,
				updateUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};

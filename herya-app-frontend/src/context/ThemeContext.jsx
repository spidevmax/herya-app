import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("herya_theme");
		if (saved) return saved === "dark";
		if (typeof window !== "undefined") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		}
		return false;
	});

	useEffect(() => {
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
		localStorage.setItem("herya_theme", isDark ? "dark" : "light");
	}, [isDark]);

	// Listen for system preference changes (only when no saved preference)
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e) => {
			const saved = localStorage.getItem("herya_theme");
			if (!saved) setIsDark(e.matches);
		};
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const toggleTheme = () => setIsDark((prev) => !prev);

	/** Set theme explicitly: "dark" | "light" */
	const setTheme = useCallback((value) => {
		setIsDark(value === "dark");
	}, []);

	return (
		<ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) throw new Error("useTheme must be used within ThemeProvider");
	return context;
}

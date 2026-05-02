import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "herya_active_session";

/**
 * Persists session draft and active state to localStorage
 * so the user can recover if the app closes mid-session.
 */
export default function useSessionPersistence() {
	const [recovered, setRecovered] = useState(null);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				// Only recover sessions less than 24h old
				if (parsed?.savedAt && Date.now() - parsed.savedAt < 86400000) {
					setRecovered(parsed);
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		} catch {
			localStorage.removeItem(STORAGE_KEY);
		}
	}, []);

	const saveSession = useCallback((data) => {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ ...data, savedAt: Date.now() }),
			);
		} catch {
			// Storage full or unavailable — silently fail
		}
	}, []);

	const clearSession = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setRecovered(null);
	}, []);

	const dismissRecovery = useCallback(() => {
		setRecovered(null);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	return { recovered, saveSession, clearSession, dismissRecovery };
}

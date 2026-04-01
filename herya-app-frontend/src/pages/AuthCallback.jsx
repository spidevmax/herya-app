import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from '@/context/AuthContext';

const ERROR_MESSAGES = {
	missing_google_code: "No se recibio el codigo de Google.",
	google_auth_failed: "No se pudo completar el acceso con Google.",
};

export default function AuthCallback() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { loginWithToken } = useAuth();
	const [error, setError] = useState("");

	const token = useMemo(() => params.get("token"), [params]);
	const authError = useMemo(() => params.get("error"), [params]);

	useEffect(() => {
		let cancelled = false;

		const completeLogin = async () => {
			if (authError) {
				setError(ERROR_MESSAGES[authError] || "Error de autenticacion social.");
				return;
			}

			if (!token) {
				setError("No se recibio token de autenticacion.");
				return;
			}

			try {
				await loginWithToken(token);
				if (!cancelled) {
					navigate("/", { replace: true });
				}
			} catch {
				if (!cancelled) {
					setError("No se pudo crear la sesion.");
				}
			}
		};

		completeLogin();

		return () => {
			cancelled = true;
		};
	}, [authError, loginWithToken, navigate, token]);

	return (
		<div className="min-h-dvh flex items-center justify-center px-6">
			<div className="w-full max-w-md rounded-3xl bg-[var(--color-surface-card)] p-6 text-center shadow-[var(--shadow-card)]">
				{error ? (
					<>
						<p className="text-[var(--color-error-text)] text-sm font-semibold mb-4">
							{error}
						</p>
						<button
							type="button"
							onClick={() => navigate("/login", { replace: true })}
							className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
						>
							Volver al login
						</button>
					</>
				) : (
					<>
						<div className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
						<p className="text-[var(--color-text-primary)] text-sm font-semibold">
							Completando inicio de sesion...
						</p>
					</>
				)}
			</div>
		</div>
	);
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthCallback() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const { loginWithToken } = useAuth();
	const { t } = useLanguage();
	const [error, setError] = useState("");

	const token = useMemo(() => params.get("token"), [params]);
	const authError = useMemo(() => params.get("error"), [params]);

	useEffect(() => {
		let cancelled = false;
		const errorMessages = {
			missing_google_code: t("auth_callback.errors.missing_google_code"),
			google_auth_failed: t("auth_callback.errors.google_auth_failed"),
		};

		const completeLogin = async () => {
			if (authError) {
				setError(
					errorMessages[authError] ||
						t("auth_callback.errors.social_auth_failed"),
				);
				return;
			}

			if (!token) {
				setError(t("auth_callback.errors.missing_auth_token"));
				return;
			}

			try {
				await loginWithToken(token);
				if (!cancelled) {
					navigate("/", { replace: true });
				}
			} catch {
				if (!cancelled) {
					setError(t("auth_callback.errors.create_session_failed"));
				}
			}
		};

		completeLogin();

		return () => {
			cancelled = true;
		};
	}, [authError, loginWithToken, navigate, t, token]);

	return (
		<main className="min-h-dvh flex items-center justify-center px-6">
			<section
				aria-live="polite"
				aria-busy={!error}
				className="w-full max-w-md rounded-3xl bg-[var(--color-surface-card)] p-6 text-center shadow-[var(--shadow-card)]"
			>
				{error ? (
					<>
						<p
							role="alert"
							className="text-[var(--color-error-text)] text-sm font-semibold mb-4"
						>
							{error}
						</p>
						<button
							type="button"
							onClick={() => navigate("/login", { replace: true })}
							className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold"
						>
							{t("auth_callback.back_to_login")}
						</button>
					</>
				) : (
					<>
						<div
							aria-hidden="true"
							className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"
						/>
						<p className="text-[var(--color-text-primary)] text-sm font-semibold">
							{t("auth_callback.completing")}
						</p>
					</>
				)}
			</section>
		</main>
	);
}

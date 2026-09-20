import { useState } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "@/api/auth.api";
import AuthShell from "@/components/identity/AuthShell";
import { useLanguage } from "@/context/LanguageContext";

const isDev = import.meta.env.DEV;

const ForgotPassword = () => {
	const { t, lang } = useLanguage();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [resetUrl, setResetUrl] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const { data } = await requestPasswordReset({ email, locale: lang });
			setSubmitted(true);
			setResetUrl(isDev ? data?.data?.resetUrl || "" : "");
		} catch (err) {
			setError(err?.response?.data?.message || t("forgot_password.error"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthShell>
			<h1 className="display text-[2.4rem]">{t("forgot_password.title")}</h1>
			<p className="mt-3 text-[0.95rem]" style={{ color: "var(--ink-soft)" }}>
				{t("forgot_password.subtitle")}
			</p>

			{error && (
				<div
					role="alert"
					className="ink-block mt-5 px-4 py-3 text-sm font-bold"
					style={{
						background: "var(--alert-bg)",
						borderColor: "var(--alert)",
						color: "var(--alert)",
						boxShadow: "none",
					}}
				>
					{error}
				</div>
			)}

			{submitted ? (
				<div className="mt-7 flex flex-col gap-4">
					<p
						role="status"
						className="ink-block px-4 py-3 text-[0.95rem] font-bold"
						style={{ boxShadow: "none" }}
					>
						{t("forgot_password.success")}
					</p>

					{/* Dev-only shortcut: the API returns the reset link directly so
					    there is no need to go through a real inbox locally. */}
					{resetUrl && (
						<a
							href={resetUrl}
							className="ink-block ink-block--press display w-full py-3 text-center text-[1.05rem]"
							style={{ background: "var(--surya)", color: "var(--on-fill)" }}
						>
							{t("forgot_password.open_reset_link")}
						</a>
					)}

					<Link to="/login" className="text-center text-sm font-bold underline">
						{t("forgot_password.back_to_login")}
					</Link>
				</div>
			) : (
				<form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
					<div>
						<label htmlFor="forgot-email" className="mb-2 block text-sm font-bold">
							{t("forgot_password.email_placeholder")}
						</label>
						<input
							id="forgot-email"
							type="email"
							autoComplete="email"
							required
							placeholder={t("forgot_password.email_placeholder")}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="ink-field"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="ink-block ink-block--press display w-full py-3.5 text-[1.15rem]"
						style={{
							background: "var(--surya)",
							color: "var(--on-fill)",
							cursor: loading ? "wait" : "pointer",
							opacity: loading ? 0.7 : 1,
						}}
					>
						{loading ? t("forgot_password.submitting") : t("forgot_password.submit")}
					</button>

					<Link to="/login" className="text-center text-sm font-bold underline">
						{t("forgot_password.back_to_login")}
					</Link>
				</form>
			)}
		</AuthShell>
	);
};

export default ForgotPassword;

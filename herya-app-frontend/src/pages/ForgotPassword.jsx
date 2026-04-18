import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "@/api/auth.api";
import AuthBrandHeader from "@/components/auth/AuthBrandHeader";
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
		<div className="min-h-dvh w-full bg-[var(--gradient-app)] px-4 py-8 sm:px-6">
			<motion.div
				initial={{ opacity: 0, y: 18 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.35 }}
				className="mx-auto w-full max-w-md rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] sm:p-8"
			>
				<AuthBrandHeader compact showSubtitle={false} />

				<h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
					{t("forgot_password.title")}
				</h1>
				<p className="mt-2 text-sm text-[var(--color-text-muted)]">
					{t("forgot_password.subtitle")}
				</p>

				{error && (
					<div role="alert" className="mt-4 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error-text)]">
						{error}
					</div>
				)}

				{submitted ? (
					<div className="mt-6 space-y-4">
						<p className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
							{t("forgot_password.success")}
						</p>
						{resetUrl && (
							<a
								href={resetUrl}
								className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-card)]"
							>
								{t("forgot_password.open_reset_link")}
							</a>
						)}
						<Link
							to="/login"
							className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--color-border-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
						>
							{t("forgot_password.back_to_login")}
						</Link>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<div className="relative">
							<Mail
								size={17}
								className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
							/>
							<input
								type="email"
								autoComplete="email"
								required
								placeholder={t("forgot_password.email_placeholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] py-3.5 pl-11 pr-4 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/40"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full rounded-2xl bg-gradient-to-r from-[var(--color-secondary)] to-[var(--color-secondary-dark)] px-4 py-3.5 text-sm font-bold text-[var(--color-text-primary)] shadow-[var(--shadow-card)] disabled:cursor-not-allowed disabled:opacity-70"
						>
							{loading
								? t("forgot_password.submitting")
								: t("forgot_password.submit")}
						</button>
						<p className="text-center text-sm text-[var(--color-text-muted)]">
							<Link
								to="/login"
								className="font-semibold text-[var(--color-primary)] hover:underline"
							>
								{t("forgot_password.back_to_login")}
							</Link>
						</p>
					</form>
				)}
			</motion.div>
		</div>
	);
};

export default ForgotPassword;

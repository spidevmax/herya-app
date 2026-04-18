import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/api/auth.api";
import { useLanguage } from "@/context/LanguageContext";
import AuthBrandHeader from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui";

export default function ResetPassword() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!token) {
			setError(tr("reset_password.invalid_token", "Invalid or missing reset token"));
			return;
		}

		if (form.newPassword !== form.confirmPassword) {
			setError(tr("reset_password.mismatch", "Passwords don't match"));
			return;
		}

		setError("");
		setLoading(true);
		try {
			await resetPassword({
				token,
				newPassword: form.newPassword,
				confirmPassword: form.confirmPassword,
			});
			setSuccess(true);
			setTimeout(() => navigate("/login"), 2000);
		} catch (err) {
			setError(err?.response?.data?.message || tr("reset_password.error", "Password reset failed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<main
			className="min-h-dvh flex flex-col items-center justify-center px-6 overflow-hidden"
			style={{ background: "var(--gradient-warm)" }}
		>
			<div aria-hidden="true" className="absolute top-[6%] left-[8%] w-20 h-20 rounded-full bg-[var(--color-surface-card)]/25 blur-xl" />
			<div aria-hidden="true" className="absolute bottom-[12%] right-[10%] w-24 h-24 rounded-full bg-[var(--color-secondary)]/20 blur-xl" />

			<motion.div
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-sm relative z-10"
			>
				<AuthBrandHeader compact showSubtitle={false} />

				{!success && (
					<>
						<button
							type="button"
							onClick={() => navigate("/login")}
							aria-label={tr("reset_password.back", "Back")}
							className="flex items-center gap-2 mb-6 font-bold text-lg text-[var(--color-primary)] hover:opacity-70 transition"
						>
							<ArrowLeft size={20} aria-hidden="true" />
							{tr("reset_password.back", "Back")}
						</button>

						<header className="text-center mb-8">
							<Lock
								size={54}
								aria-hidden="true"
								className="mb-4 inline-block text-[var(--color-primary)]"
							/>
							<h1 className="font-display text-4xl font-bold mb-2 text-[var(--color-primary)]">
								{tr("reset_password.title", "New password")}
							</h1>
							<p className="text-sm text-[var(--color-text-secondary)]">
								{tr("reset_password.subtitle", "Enter your new secure password")}
							</p>
						</header>

						<motion.section
							aria-label={tr("reset_password.title", "New password")}
							className="rounded-3xl p-8 backdrop-blur-sm border-[3px] border-[var(--color-secondary)] bg-[var(--color-surface-card)]"
							style={{
								boxShadow: "var(--shadow-warm)",
							}}
							whileHover={{
								y: -8,
								scale: 1.02,
								boxShadow: "var(--shadow-warm-hover)",
							}}
						>
							{error && (
								<motion.p
									role="alert"
									initial={{ opacity: 0, y: -8, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									className="mb-4 px-5 py-4 rounded-2xl text-sm font-semibold bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-l-4 border-[var(--color-accent)]"
								>
									{error}
								</motion.p>
							)}

							<form onSubmit={handleSubmit} className="flex flex-col gap-5">
								<div className="relative">
									<Lock
										size={20}
										className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
									/>
									<input
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										required
										aria-label={tr("reset_password.new_password_label", "New password")}
										placeholder="••••••••"
										value={form.newPassword}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												newPassword: e.target.value,
											}))
										}
										className="input-base input-base-lg pl-12 pr-12"
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										aria-label={showPassword ? tr("login.hide_password", "Hide password") : tr("login.show_password", "Show password")}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] hover:opacity-70 transition"
									>
										{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>

								<div className="relative">
									<Lock
										size={20}
										className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
									/>
									<input
										type={showConfirmPassword ? "text" : "password"}
										autoComplete="new-password"
										required
										aria-label={tr("reset_password.confirm_password_label", "Confirm password")}
										placeholder="••••••••"
										value={form.confirmPassword}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												confirmPassword: e.target.value,
											}))
										}
										className="input-base input-base-lg pl-12 pr-12"
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword((v) => !v)}
										aria-label={showConfirmPassword ? tr("login.hide_password", "Hide password") : tr("login.show_password", "Show password")}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)] hover:opacity-70 transition"
									>
										{showConfirmPassword ? (
											<EyeOff size={20} />
										) : (
											<Eye size={20} />
										)}
									</button>
								</div>

								<Button
									type="submit"
									disabled={loading}
									size="lg"
									className="mt-4 w-full"
								>
									{loading
										? tr("reset_password.submitting", "Resetting...")
										: tr("reset_password.submit", "Reset Password")}
								</Button>
							</form>

							<p className="text-center text-sm mt-6 font-semibold text-[var(--color-text-secondary)]">
								<Link
									to="/login"
									className="font-bold text-[var(--color-secondary)] hover:underline transition"
								>
									{tr("reset_password.back_to_login", "Back to login")}
								</Link>
							</p>
						</motion.section>
					</>
				)}

				{success && (
					<motion.section
						aria-labelledby="reset-success-heading"
						role="status"
						aria-live="polite"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-3xl p-8 border-[3px] border-[var(--color-secondary)] backdrop-blur-sm bg-[var(--color-surface-card)]"
						style={{
							boxShadow: "var(--shadow-warm)",
						}}
					>
						<div className="text-center">
							<Lock
								size={46}
								aria-hidden="true"
								className="mb-4 inline-block text-[var(--color-primary)]"
							/>
							<h2 id="reset-success-heading" className="font-display text-3xl font-bold mb-3 text-[var(--color-primary)]">
								{tr("reset_password.success_title", "All set")}
							</h2>
							<p className="text-sm mb-6 font-semibold text-[var(--color-text-secondary)]">
								{tr("reset_password.success_message", "Your password has been successfully reset. Redirecting to login...")}
							</p>
							<Link
								to="/login"
								className="inline-block font-bold py-4 px-8 rounded-3xl bg-[var(--color-primary)] text-white transition hover:opacity-80"
								style={{ boxShadow: "var(--shadow-button)" }}
							>
								{tr("reset_password.back_to_login", "Back to login")}
							</Link>
						</div>
					</motion.section>
				)}
			</motion.div>
		</main>
	);
}

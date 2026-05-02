import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "@/api/auth.api";
import AuthBrandHeader from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ id, message }) {
	if (!message) return null;
	return (
		<p
			id={id}
			role="alert"
			className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-text)]"
		>
			<AlertCircle size={14} aria-hidden="true" />
			<span>{message}</span>
		</p>
	);
}

export default function Login() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const { t } = useLanguage();
	const [form, setForm] = useState({ email: "", password: "" });
	const [showPw, setShowPw] = useState(false);
	const [errors, setErrors] = useState({});
	const [formError, setFormError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showForgot, setShowForgot] = useState(false);
	const [forgotEmail, setForgotEmail] = useState("");
	const [forgotLoading, setForgotLoading] = useState(false);
	const [forgotMessage, setForgotMessage] = useState("");
	const [forgotStatus, setForgotStatus] = useState("");

	const updateField = (field, value) => {
		setForm((f) => ({ ...f, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[field];
				return next;
			});
		}
	};

	const validate = () => {
		const next = {};
		if (!form.email.trim()) next.email = t("login.errors.email_required");
		else if (!EMAIL_RE.test(form.email.trim()))
			next.email = t("login.errors.email_invalid");
		if (!form.password) next.password = t("login.errors.password_required");
		return next;
	};

	const mapServerError = (err) => {
		const status = err?.response?.status;
		const message = err?.response?.data?.message || "";
		const fieldErrors = err?.response?.data?.errors;

		// express-validator field-level errors
		if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
			const next = {};
			for (const fe of fieldErrors) {
				if (fe.field === "email") {
					next.email = /valid/i.test(fe.message)
						? t("login.errors.email_invalid")
						: t("login.errors.email_required");
				} else if (fe.field === "password") {
					next.password = t("login.errors.password_required");
				}
			}
			if (Object.keys(next).length > 0) {
				setErrors(next);
				return;
			}
		}

		// 401 (wrong password) and 404 (user not found) collapse to a single
		// "invalid email or password" to avoid leaking account existence.
		if (status === 401 || status === 404) {
			setErrors({ email: t("login.errors.invalid_credentials") });
			return;
		}

		setFormError(message || t("login.errors.generic"));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setFormError("");

		const validation = validate();
		if (Object.keys(validation).length > 0) {
			setErrors(validation);
			return;
		}
		setErrors({});

		setLoading(true);
		try {
			await login(form);
			navigate("/");
		} catch (err) {
			mapServerError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleForgotSubmit = async (e) => {
		e.preventDefault();
		setForgotLoading(true);
		setForgotMessage("");
		setForgotStatus("");
		try {
			await requestPasswordReset({ email: forgotEmail });
			setForgotMessage(t("forgot_password.success"));
			setForgotStatus("success");
			setTimeout(() => {
				setShowForgot(false);
				setForgotEmail("");
				setForgotMessage("");
				setForgotStatus("");
			}, 2000);
		} catch (err) {
			setForgotMessage(
				err?.response?.data?.message || t("forgot_password.error"),
			);
			setForgotStatus("error");
		} finally {
			setForgotLoading(false);
		}
	};

	const inputErrorStyle = (field) =>
		errors[field]
			? {
					borderColor: "var(--color-error-text)",
					boxShadow: "0 0 0 1px var(--color-error-text)",
				}
			: undefined;

	return (
		<div
			className="min-h-dvh w-full px-4 py-8 sm:px-6 sm:py-10 lg:flex lg:h-dvh lg:min-h-0 lg:items-center lg:justify-center lg:overflow-auto lg:px-8 lg:py-8 xl:px-10"
			style={{ background: "var(--gradient-primary)" }}
		>
			<div
				className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md items-center justify-center lg:grid lg:min-h-0 lg:max-w-[90rem] lg:grid-cols-2 lg:items-stretch lg:overflow-hidden lg:rounded-[2rem] lg:shadow-[0_28px_90px_rgba(15,30,60,0.22)]"
				style={{
					backgroundColor: "var(--color-surface-card)",
					border: "1px solid var(--color-border)",
				}}
			>
				<aside className="relative hidden min-w-0 flex-col overflow-hidden bg-[#f5e7d4] bg-[url('/images/rex-mascot-login.png')] bg-no-repeat [background-position:right_-8%_bottom_4%] [background-size:62%] px-14 py-16 lg:flex lg:min-h-[min(52rem,calc(100dvh-5rem))] xl:[background-size:55%] xl:px-20 xl:py-20 dark:bg-[#1f1611]">
					<div
						aria-hidden="true"
						className="absolute inset-0"
						style={{
							background:
								"linear-gradient(135deg,#f6ead9 0%,#efdcc3 35%, rgba(191,124,85,0.55) 70%, rgba(120,66,44,0.75) 100%)",
						}}
					/>
					<div
						aria-hidden="true"
						className="absolute inset-0"
						style={{
							background:
								"radial-gradient(ellipse 60% 50% at 18% 22%, rgba(255,250,240,0.55), transparent 70%)",
						}}
					/>
					<div
						aria-hidden="true"
						className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
						style={{
							backgroundImage:
								"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
						}}
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-y-0 right-0 w-px"
						style={{ boxShadow: "inset -1px 0 0 rgba(0,0,0,0.04)" }}
					/>

					<div className="relative z-10 max-w-[28ch]">
						<h1 className="font-display font-medium tracking-[-0.02em] leading-none text-[52px] xl:text-[60px] text-[#2b1d14] dark:text-[#f3e9da]">
							Herya
						</h1>
						<p className="mt-5 max-w-[26ch] text-[18px] xl:text-[20px] leading-[1.55] font-normal text-[#5a4536]/90 dark:text-[#bfa78f]">
							{t("login.subtitle")}
						</p>
					</div>
				</aside>

				<div
					className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-md items-center justify-center lg:mx-0 lg:min-h-[min(52rem,calc(100dvh-5rem))] lg:max-w-none lg:px-12 lg:py-10 xl:px-20"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<motion.div
						initial={false}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35 }}
						className="w-full rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] sm:p-8 lg:max-w-md lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
					>
						<div className="lg:hidden">
							<AuthBrandHeader />
						</div>

						{!showForgot ? (
							<>
								<div className="mb-7 text-center">
									<h2 className="text-3xl font-semibold text-[var(--color-text-primary)]">
										{t("login.welcome")}
									</h2>
								</div>

								{formError && (
									<div
										role="alert"
										className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
									>
										<AlertCircle size={16} aria-hidden="true" />
										<span>{formError}</span>
									</div>
								)}

								<form
									onSubmit={handleSubmit}
									noValidate
									className="flex flex-col gap-4"
								>
									<div>
										<label
											htmlFor="login-email"
											className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
										>
											{t("login.email_placeholder")}
										</label>
										<div className="relative">
											<Mail
												size={18}
												className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
											/>
											<input
												id="login-email"
												type="email"
												autoComplete="email"
												aria-invalid={!!errors.email}
												aria-describedby={
													errors.email ? "login-email-error" : undefined
												}
												placeholder={t("login.email_placeholder")}
												value={form.email}
												onChange={(e) => updateField("email", e.target.value)}
												className="input-base pl-10 pr-4"
												style={inputErrorStyle("email")}
											/>
										</div>
										<FieldError id="login-email-error" message={errors.email} />
									</div>

									<div>
										<label
											htmlFor="login-password"
											className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
										>
											{t("login.password")}
										</label>
										<div className="relative">
											<Lock
												size={18}
												className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
											/>
											<input
												id="login-password"
												type={showPw ? "text" : "password"}
												autoComplete="current-password"
												aria-invalid={!!errors.password}
												aria-describedby={
													errors.password ? "login-password-error" : undefined
												}
												placeholder={t("login.password")}
												value={form.password}
												onChange={(e) =>
													updateField("password", e.target.value)
												}
												className="input-base pl-10 pr-11"
												style={inputErrorStyle("password")}
											/>
											<button
												type="button"
												onClick={() => setShowPw((v) => !v)}
												aria-label={
													showPw
														? t("login.hide_password")
														: t("login.show_password")
												}
												className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
											>
												{showPw ? <EyeOff size={18} /> : <Eye size={18} />}
											</button>
										</div>
										<FieldError
											id="login-password-error"
											message={errors.password}
										/>
									</div>

									<div className="text-right">
										<button
											type="button"
											onClick={() => setShowForgot(true)}
											className="text-sm font-medium text-[var(--color-primary)] hover:underline"
										>
											{t("login.forgot_password")}
										</button>
									</div>

									<Button
										type="submit"
										disabled={loading}
										className="mt-1 w-full"
									>
										{loading ? t("login.submitting") : t("login.submit")}
									</Button>
								</form>

								<p className="mt-6 text-center text-sm font-medium text-[var(--color-text-secondary)]">
									{t("login.no_account")}{" "}
									<Link
										to="/register"
										className="font-semibold text-[var(--color-primary)] hover:underline"
									>
										{t("login.register_link")}
									</Link>
								</p>
							</>
						) : (
							<>
								<button
									type="button"
									onClick={() => setShowForgot(false)}
									className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
								>
									<ArrowLeft size={16} /> {t("forgot_password.back_to_login")}
								</button>
								<h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
									{t("forgot_password.title")}
								</h2>
								<p className="mt-2 mb-6 text-sm font-medium text-[var(--color-text-secondary)]">
									{t("forgot_password.subtitle")}
								</p>

								{forgotMessage && (
									<div
										className="mb-4 rounded-xl px-4 py-3 text-sm font-medium text-center"
										style={{
											backgroundColor:
												forgotStatus === "success"
													? "var(--color-info)"
													: "var(--color-error-bg)",
											color:
												forgotStatus === "success"
													? "white"
													: "var(--color-error-text)",
										}}
									>
										{forgotMessage}
									</div>
								)}

								<form
									onSubmit={handleForgotSubmit}
									className="flex flex-col gap-4"
								>
									<div>
										<label
											htmlFor="forgot-email"
											className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
										>
											{t("forgot_password.email_placeholder")}
										</label>
										<div className="relative">
											<Mail
												size={18}
												className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
											/>
											<input
												id="forgot-email"
												type="email"
												autoComplete="email"
												required
												placeholder={t("forgot_password.email_placeholder")}
												value={forgotEmail}
												onChange={(e) => setForgotEmail(e.target.value)}
												className="input-base pl-10 pr-4"
											/>
										</div>
									</div>
									<Button
										type="submit"
										disabled={forgotLoading}
										className="w-full"
									>
										{forgotLoading
											? t("forgot_password.submitting")
											: t("forgot_password.submit")}
									</Button>
								</form>
							</>
						)}
					</motion.div>
				</div>
			</div>
		</div>
	);
}

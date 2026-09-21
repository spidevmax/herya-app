import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "@/api/auth.api";
import BreathBuddy from "@/components/identity/BreathBuddy";
import BreathMark from "@/components/identity/BreathMark";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FieldError = ({ id, message }) => {
	if (!message) return null;
	return (
		<p
			id={id}
			role="alert"
			className="mt-1.5 flex items-center gap-1.5 text-xs font-bold"
			style={{ color: "var(--alert)" }}
		>
			<AlertCircle size={14} aria-hidden="true" />
			<span>{message}</span>
		</p>
	);
};

const Login = () => {
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

	return (
		<div
			data-identity="next"
			className="min-h-dvh w-full lg:grid lg:grid-cols-[1fr_1.1fr]"
			style={{ background: "var(--paper)" }}
		>
			{/* Left panel — the character does the welcoming. Flat colour, no
			    photography, no gradient: the ground is one field of chandra. */}
			<aside
				className="relative hidden flex-col justify-between p-12 lg:flex xl:p-16"
				style={{
					background: "var(--chandra)",
					borderRight: "var(--ink-width) solid var(--ink)",
				}}
			>
				<div className="flex items-center gap-3">
					{/* On the chandra panel the cool arc would vanish, so it takes
					    the ink used for text on a colour fill. */}
					<BreathMark size={38} cool="var(--on-fill)" />
					<span
						className="display text-[1.5rem]"
						style={{ color: "var(--on-fill)" }}
					>
						Herya
					</span>
				</div>

				<div className="flex flex-1 items-center justify-center">
					{/* outline is pinned to on-fill: theme ink goes near-white in dark
					    mode and would wash the figure out against the panel. */}
					<BreathBuddy
						size={200}
						phase="inhale"
						fill="var(--surya)"
						outline="var(--on-fill)"
					/>
				</div>

				<p
					className="display max-w-[16ch] text-[2.4rem] xl:text-[2.9rem]"
					style={{ color: "var(--on-fill)" }}
				>
					{t("login.subtitle")}
				</p>
			</aside>

			{/* Right panel — the form */}
			<div className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
				<div className="w-full max-w-[26rem]">
					{/* Brand shows on narrow screens, where the panel is gone. */}
					<div className="mb-8 flex items-center gap-3 lg:hidden">
						<BreathMark size={34} />
						<span className="display text-[1.4rem]">Herya</span>
					</div>

					{!showForgot ? (
						<>
							<h1 className="display text-[2.6rem] sm:text-[3rem]">
								{t("login.welcome")}
							</h1>

							{formError && (
								<div
									role="alert"
									className="ink-block mt-5 flex items-center gap-2 px-4 py-3 text-sm font-bold"
									style={{
										background: "var(--alert-bg)",
										borderColor: "var(--alert)",
										color: "var(--alert)",
										boxShadow: "none",
									}}
								>
									<AlertCircle size={16} aria-hidden="true" />
									<span>{formError}</span>
								</div>
							)}

							<form
								onSubmit={handleSubmit}
								noValidate
								className="mt-7 flex flex-col gap-5"
							>
								<div>
									<label
										htmlFor="login-email"
										className="mb-2 block text-sm font-bold"
									>
										{t("login.email_placeholder")}
									</label>
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
										className="ink-field"
									/>
									<FieldError id="login-email-error" message={errors.email} />
								</div>

								<div>
									<label
										htmlFor="login-password"
										className="mb-2 block text-sm font-bold"
									>
										{t("login.password")}
									</label>
									<div className="relative">
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
											onChange={(e) => updateField("password", e.target.value)}
											className="ink-field pr-12"
										/>
										<button
											type="button"
											onClick={() => setShowPw((v) => !v)}
											aria-label={
												showPw
													? t("login.hide_password")
													: t("login.show_password")
											}
											className="absolute right-4 top-1/2 -translate-y-1/2"
											style={{ color: "var(--ink-soft)" }}
										>
											{showPw ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									<FieldError
										id="login-password-error"
										message={errors.password}
									/>
								</div>

								<button
									type="submit"
									disabled={loading}
									className="ink-block ink-block--press display mt-1 w-full py-3.5 text-[1.15rem]"
									style={{
										background: "var(--surya)",
										color: "var(--on-fill)",
										cursor: loading ? "wait" : "pointer",
										opacity: loading ? 0.7 : 1,
									}}
								>
									{loading ? t("login.submitting") : t("login.submit")}
								</button>

								<button
									type="button"
									onClick={() => setShowForgot(true)}
									className="text-sm font-bold underline"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("login.forgot_password")}
								</button>
							</form>

							<p className="mt-8 text-sm font-bold">
								{t("login.no_account")}{" "}
								<Link
									to="/register"
									className="underline"
									style={{ color: "var(--ink)" }}
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
								className="mb-6 inline-flex items-center gap-2 text-sm font-bold underline"
								style={{ color: "var(--ink-soft)" }}
							>
								<ArrowLeft size={16} /> {t("forgot_password.back_to_login")}
							</button>

							<h1 className="display text-[2.2rem]">
								{t("forgot_password.title")}
							</h1>
							<p
								className="mt-3 text-[0.95rem]"
								style={{ color: "var(--ink-soft)" }}
							>
								{t("forgot_password.subtitle")}
							</p>

							{forgotMessage && (
								<output
									className="ink-block mt-5 block px-4 py-3 text-sm font-bold"
									style={{
										background:
											forgotStatus === "success"
												? "var(--chandra)"
												: "var(--alert-bg)",
										borderColor:
											forgotStatus === "success"
												? "var(--ink)"
												: "var(--alert)",
										color:
											forgotStatus === "success"
												? "var(--on-fill)"
												: "var(--alert)",
										boxShadow: "none",
									}}
								>
									{forgotMessage}
								</output>
							)}

							<form
								onSubmit={handleForgotSubmit}
								className="mt-7 flex flex-col gap-5"
							>
								<div>
									<label
										htmlFor="forgot-email"
										className="mb-2 block text-sm font-bold"
									>
										{t("forgot_password.email_placeholder")}
									</label>
									<input
										id="forgot-email"
										type="email"
										autoComplete="email"
										required
										placeholder={t("forgot_password.email_placeholder")}
										value={forgotEmail}
										onChange={(e) => setForgotEmail(e.target.value)}
										className="ink-field"
									/>
								</div>
								<button
									type="submit"
									disabled={forgotLoading}
									className="ink-block ink-block--press display w-full py-3.5 text-[1.15rem]"
									style={{
										background: "var(--surya)",
										color: "var(--on-fill)",
										cursor: forgotLoading ? "wait" : "pointer",
										opacity: forgotLoading ? 0.7 : 1,
									}}
								>
									{forgotLoading
										? t("forgot_password.submitting")
										: t("forgot_password.submit")}
								</button>
							</form>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default Login;

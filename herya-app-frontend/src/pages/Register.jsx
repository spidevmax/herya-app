import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthBrandHeader from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui";

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

export default function Register() {
	const navigate = useNavigate();
	const { register } = useAuth();
	const { t } = useLanguage();
	const [form, setForm] = useState({
		name: "",
		email: "",
		password: "",
		passwordConfirm: "",
		role: "user",
	});
	const [showPw, setShowPw] = useState(false);
	const [showConfirmPw, setShowConfirmPw] = useState(false);
	const [errors, setErrors] = useState({});
	const [formError, setFormError] = useState("");
	const [loading, setLoading] = useState(false);

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
		if (!form.name.trim()) next.name = t("register.errors.name_required");
		if (!form.email.trim()) next.email = t("register.errors.email_required");
		else if (!EMAIL_RE.test(form.email.trim()))
			next.email = t("register.errors.email_invalid");
		if (!form.password) next.password = t("register.errors.password_required");
		else if (form.password.length < 8)
			next.password = t("register.errors.password_too_short");
		if (!form.passwordConfirm)
			next.passwordConfirm = t("register.errors.confirm_required");
		else if (form.password && form.password !== form.passwordConfirm)
			next.passwordConfirm = t("register.password_mismatch");
		return next;
	};

	const mapServerError = (err) => {
		const status = err?.response?.status;
		const message = err?.response?.data?.message || "";
		const lower = message.toLowerCase();

		if (status === 409 || lower.includes("already") || lower.includes("in use") || lower.includes("exist")) {
			setErrors((prev) => ({ ...prev, email: t("register.errors.email_in_use") }));
			return;
		}
		if (lower.includes("email")) {
			setErrors((prev) => ({ ...prev, email: t("register.errors.email_invalid") }));
			return;
		}
		if (lower.includes("password")) {
			setErrors((prev) => ({ ...prev, password: t("register.errors.password_too_short") }));
			return;
		}
		setFormError(message || t("register.errors.generic"));
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
			await register({
				name: form.name,
				email: form.email,
				password: form.password,
				role: form.role,
			});
			navigate("/");
		} catch (err) {
			mapServerError(err);
		} finally {
			setLoading(false);
		}
	};

	const inputErrorStyle = (field) =>
		errors[field]
			? { borderColor: "var(--color-error-text)", boxShadow: "0 0 0 1px var(--color-error-text)" }
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
				<aside
					className="hidden min-w-0 flex-col px-10 py-10 lg:flex lg:min-h-[min(52rem,calc(100dvh-5rem))] xl:px-14 xl:py-12"
					style={{ backgroundColor: "var(--color-surface-secondary)" }}
				>
					<h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-text-primary)] xl:text-5xl">
						Herya
					</h1>

					<div className="mt-6 flex w-full flex-1 items-center justify-center">
						<img
							src="/images/rex-mascot-register.png"
							alt="Rex, mascota de Herya practicando yoga en equilibrio junto al mar"
							className="h-full max-h-[min(36rem,62dvh)] w-full max-w-[34rem] object-contain"
						/>
					</div>

					<p className="mt-6 max-w-lg text-2xl font-semibold leading-snug text-[var(--color-text-primary)] xl:text-3xl">
						{t("login.subtitle")}
					</p>
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

					<div className="mb-7 text-center">
						<h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
							{t("register.heading")}
						</h1>
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

					<form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
						<div>
							<p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
								{t("register.account_type_label")}
							</p>
							<div className="grid grid-cols-2 gap-2">
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, role: "user" }))}
									aria-pressed={form.role === "user"}
									className="rounded-xl border px-3 py-2 text-sm font-semibold transition"
									style={{
										borderColor:
											form.role === "user"
												? "var(--color-primary)"
												: "var(--color-border)",
										backgroundColor:
											form.role === "user"
												? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
												: "var(--color-surface)",
										color: "var(--color-text-primary)",
									}}
								>
									{t("register.account_type_standard")}
								</button>
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, role: "tutor" }))}
									aria-pressed={form.role === "tutor"}
									className="rounded-xl border px-3 py-2 text-sm font-semibold transition"
									style={{
										borderColor:
											form.role === "tutor"
												? "var(--color-primary)"
												: "var(--color-border)",
										backgroundColor:
											form.role === "tutor"
												? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
												: "var(--color-surface)",
										color: "var(--color-text-primary)",
									}}
								>
									{t("register.account_type_tutor")}
								</button>
							</div>
						</div>

						<div>
							<label
								htmlFor="register-name"
								className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
							>
								{t("register.full_name")}
							</label>
							<div className="relative">
								<User
									size={18}
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
								/>
								<input
									id="register-name"
									type="text"
									autoComplete="name"
									aria-invalid={!!errors.name}
									aria-describedby={errors.name ? "name-error" : undefined}
									placeholder={t("register.full_name")}
									value={form.name}
									onChange={(e) => updateField("name", e.target.value)}
									className="input-base pl-10 pr-4"
									style={inputErrorStyle("name")}
								/>
							</div>
							<FieldError id="name-error" message={errors.name} />
						</div>

						<div>
							<label
								htmlFor="register-email"
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
									id="register-email"
									type="email"
									autoComplete="email"
									aria-invalid={!!errors.email}
									aria-describedby={errors.email ? "email-error" : undefined}
									placeholder={t("login.email_placeholder")}
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
									className="input-base pl-10 pr-4"
									style={inputErrorStyle("email")}
								/>
							</div>
							<FieldError id="email-error" message={errors.email} />
						</div>

						<div>
							<label
								htmlFor="register-password"
								className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
							>
								{t("register.password_label")}
							</label>
							<div className="relative">
								<Lock
									size={18}
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
								/>
								<input
									id="register-password"
									type={showPw ? "text" : "password"}
									autoComplete="new-password"
									aria-invalid={!!errors.password}
									aria-describedby={errors.password ? "password-error" : undefined}
									placeholder={t("register.password_placeholder")}
									value={form.password}
									onChange={(e) => updateField("password", e.target.value)}
									className="input-base pl-10 pr-11"
									style={inputErrorStyle("password")}
								/>
								<button
									type="button"
									onClick={() => setShowPw((v) => !v)}
									aria-label={showPw ? t("login.hide_password") : t("login.show_password")}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
								>
									{showPw ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							<FieldError id="password-error" message={errors.password} />
						</div>

						<div>
							<label
								htmlFor="register-confirm-password"
								className="mb-1.5 block text-sm font-semibold text-[var(--color-text-primary)]"
							>
								{t("register.confirm_password")}
							</label>
							<div className="relative">
								<Lock
									size={18}
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
								/>
								<input
									id="register-confirm-password"
									type={showConfirmPw ? "text" : "password"}
									autoComplete="new-password"
									aria-invalid={!!errors.passwordConfirm}
									aria-describedby={errors.passwordConfirm ? "confirm-error" : undefined}
									placeholder={t("register.confirm_password")}
									value={form.passwordConfirm}
									onChange={(e) => updateField("passwordConfirm", e.target.value)}
									className="input-base pl-10 pr-11"
									style={inputErrorStyle("passwordConfirm")}
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPw((v) => !v)}
									aria-label={showConfirmPw ? t("login.hide_password") : t("login.show_password")}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
								>
									{showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							<FieldError id="confirm-error" message={errors.passwordConfirm} />
						</div>

						<Button type="submit" disabled={loading} className="mt-1 w-full">
							{loading ? t("register.submitting") : t("register.heading")}
						</Button>
					</form>

					<p className="mt-6 text-center text-sm font-medium text-[var(--color-text-secondary)]">
						{t("register.have_account")}{" "}
						<Link
							to="/login"
							className="font-semibold text-[var(--color-primary)] hover:underline"
						>
							{t("register.login_link")}
						</Link>
					</p>
				</motion.div>
			</div>
			</div>
		</div>
	);
}

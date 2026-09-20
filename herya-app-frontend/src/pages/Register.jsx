import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BreathBuddy from "@/components/identity/BreathBuddy";
import BreathMark from "@/components/identity/BreathMark";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ id, message }) {
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
		else if (!EMAIL_RE.test(form.email.trim())) next.email = t("register.errors.email_invalid");
		if (!form.password) next.password = t("register.errors.password_required");
		else if (form.password.length < 8) next.password = t("register.errors.password_too_short");
		if (!form.passwordConfirm) next.passwordConfirm = t("register.errors.confirm_required");
		else if (form.password && form.password !== form.passwordConfirm)
			next.passwordConfirm = t("register.password_mismatch");
		return next;
	};

	const mapServerError = (err) => {
		const status = err?.response?.status;
		const message = err?.response?.data?.message || "";
		const lower = message.toLowerCase();

		if (
			status === 409 ||
			lower.includes("already") ||
			lower.includes("in use") ||
			lower.includes("exist")
		) {
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

	// Role toggle: the selected option fills with ink rather than tinting,
	// so the choice is unmistakable without relying on colour alone.
	const roleButtonStyle = (value) => ({
		background: form.role === value ? "var(--ink)" : "var(--paper-raised)",
		color: form.role === value ? "var(--paper)" : "var(--ink)",
		cursor: "pointer",
		boxShadow: "none",
	});

	return (
		<div
			data-identity="next"
			className="min-h-dvh w-full lg:grid lg:grid-cols-[1fr_1.1fr]"
			style={{ background: "var(--paper)" }}
		>
			{/* Left panel — surya here, chandra on the login screen. The two doors
			    into the app take one breath channel each. */}
			<aside
				className="relative hidden flex-col justify-between p-12 lg:flex xl:p-16"
				style={{
					background: "var(--surya)",
					borderRight: "var(--ink-width) solid var(--ink)",
				}}
			>
				<div className="flex items-center gap-3">
					{/* On a surya ground the warm arc would vanish into it. */}
					<BreathMark size={38} warm="var(--on-fill)" />
					<span className="display text-[1.5rem]" style={{ color: "var(--on-fill)" }}>
						Herya
					</span>
				</div>

				<div className="flex flex-1 items-center justify-center">
					<BreathBuddy
						size={200}
						phase="exhale"
						fill="var(--chandra)"
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
					<div className="mb-8 flex items-center gap-3 lg:hidden">
						<BreathMark size={34} />
						<span className="display text-[1.4rem]">Herya</span>
					</div>

					<h1 className="display text-[2.6rem] sm:text-[3rem]">{t("register.heading")}</h1>

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

					<form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-5">
						<fieldset className="border-0 p-0">
							<legend className="mb-2 block text-sm font-bold">
								{t("register.account_type_label")}
							</legend>
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, role: "user" }))}
									aria-pressed={form.role === "user"}
									className="ink-block px-3 py-2.5 text-sm font-bold"
									style={roleButtonStyle("user")}
								>
									{t("register.account_type_standard")}
								</button>
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, role: "tutor" }))}
									aria-pressed={form.role === "tutor"}
									className="ink-block px-3 py-2.5 text-sm font-bold"
									style={roleButtonStyle("tutor")}
								>
									{t("register.account_type_tutor")}
								</button>
							</div>
						</fieldset>

						<div>
							<label htmlFor="register-name" className="mb-2 block text-sm font-bold">
								{t("register.full_name")}
							</label>
							<input
								id="register-name"
								type="text"
								autoComplete="name"
								aria-invalid={!!errors.name}
								aria-describedby={errors.name ? "register-name-error" : undefined}
								placeholder={t("register.full_name")}
								value={form.name}
								onChange={(e) => updateField("name", e.target.value)}
								className="ink-field"
							/>
							<FieldError id="register-name-error" message={errors.name} />
						</div>

						<div>
							<label htmlFor="register-email" className="mb-2 block text-sm font-bold">
								{t("login.email_placeholder")}
							</label>
							<input
								id="register-email"
								type="email"
								autoComplete="email"
								aria-invalid={!!errors.email}
								aria-describedby={errors.email ? "register-email-error" : undefined}
								placeholder={t("login.email_placeholder")}
								value={form.email}
								onChange={(e) => updateField("email", e.target.value)}
								className="ink-field"
							/>
							<FieldError id="register-email-error" message={errors.email} />
						</div>

						<div>
							<label htmlFor="register-password" className="mb-2 block text-sm font-bold">
								{t("register.password_label")}
							</label>
							<div className="relative">
								<input
									id="register-password"
									type={showPw ? "text" : "password"}
									autoComplete="new-password"
									aria-invalid={!!errors.password}
									aria-describedby={errors.password ? "register-password-error" : undefined}
									placeholder={t("register.password_placeholder")}
									value={form.password}
									onChange={(e) => updateField("password", e.target.value)}
									className="ink-field pr-12"
								/>
								<button
									type="button"
									onClick={() => setShowPw((v) => !v)}
									aria-label={showPw ? t("login.hide_password") : t("login.show_password")}
									className="absolute right-4 top-1/2 -translate-y-1/2"
									style={{ color: "var(--ink-soft)" }}
								>
									{showPw ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							<FieldError id="register-password-error" message={errors.password} />
						</div>

						<div>
							<label htmlFor="register-confirm" className="mb-2 block text-sm font-bold">
								{t("register.confirm_password")}
							</label>
							<div className="relative">
								<input
									id="register-confirm"
									type={showConfirmPw ? "text" : "password"}
									autoComplete="new-password"
									aria-invalid={!!errors.passwordConfirm}
									aria-describedby={
										errors.passwordConfirm ? "register-confirm-error" : undefined
									}
									placeholder={t("register.confirm_password")}
									value={form.passwordConfirm}
									onChange={(e) => updateField("passwordConfirm", e.target.value)}
									className="ink-field pr-12"
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPw((v) => !v)}
									aria-label={
										showConfirmPw ? t("login.hide_password") : t("login.show_password")
									}
									className="absolute right-4 top-1/2 -translate-y-1/2"
									style={{ color: "var(--ink-soft)" }}
								>
									{showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							<FieldError id="register-confirm-error" message={errors.passwordConfirm} />
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
							{loading ? t("register.submitting") : t("register.heading")}
						</button>
					</form>

					<p className="mt-8 text-sm font-bold">
						{t("register.have_account")}{" "}
						<Link to="/login" className="underline" style={{ color: "var(--ink)" }}>
							{t("register.login_link")}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

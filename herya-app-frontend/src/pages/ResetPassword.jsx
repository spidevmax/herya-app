import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@/api/auth.api";
import AuthShell from "@/components/identity/AuthShell";
import { useLanguage } from "@/context/LanguageContext";

const ResetPassword = () => {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [errorList, setErrorList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [touched, setTouched] = useState({
		newPassword: false,
		confirmPassword: false,
	});

	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setErrorList([]);
		if (!token) {
			setError(
				tr("reset_password.invalid_token", "Invalid or missing reset token"),
			);
			return;
		}
		if (form.newPassword.length < 8) {
			setError(
				tr(
					"reset_password.too_short",
					"Password must be at least 8 characters",
				),
			);
			return;
		}
		if (form.newPassword !== form.confirmPassword) {
			setError(tr("reset_password.mismatch", "Passwords don't match"));
			return;
		}
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
			const apiErrors = err?.response?.data?.errors;
			if (Array.isArray(apiErrors) && apiErrors.length > 0) {
				setErrorList(apiErrors.map((e) => e.msg || e.message || e));
				setError("");
			} else {
				setError(
					err?.response?.data?.message ||
						tr("reset_password.error", "Password reset failed"),
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const hasError = !!error || errorList.length > 0;

	if (success) {
		return (
			<AuthShell>
				<output aria-live="polite" aria-labelledby="reset-success-heading">
					<h1 id="reset-success-heading" className="display text-[2.4rem]">
						{tr("reset_password.success_title", "All set")}
					</h1>
					<p
						className="mt-3 text-[0.95rem]"
						style={{ color: "var(--ink-soft)" }}
					>
						{tr(
							"reset_password.success_message",
							"Your password has been successfully reset. Redirecting to login...",
						)}
					</p>
					<Link
						to="/login"
						className="ink-block ink-block--press display mt-7 block w-full py-3.5 text-center text-[1.15rem]"
						style={{ background: "var(--surya)", color: "var(--on-fill)" }}
					>
						{tr("reset_password.back_to_login", "Back to login")}
					</Link>
				</output>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="mb-6 inline-flex items-center gap-2 text-sm font-bold underline"
				style={{ color: "var(--ink-soft)" }}
			>
				<ArrowLeft size={16} aria-hidden="true" />
				{tr("reset_password.back", "Back")}
			</button>

			<h1 className="display text-[2.4rem]">
				{tr("reset_password.title", "Create a new password")}
			</h1>
			<p className="mt-3 text-[0.95rem]" style={{ color: "var(--ink-soft)" }}>
				{tr(
					"reset_password.subtitle",
					"Choose a secure password to access your account.",
				)}
			</p>

			{hasError && (
				<div
					id="reset-error"
					role="alert"
					className="ink-block mt-5 px-4 py-3 text-sm font-bold"
					style={{
						background: "var(--alert-bg)",
						borderColor: "var(--alert)",
						color: "var(--alert)",
						boxShadow: "none",
					}}
				>
					{error && <div>{error}</div>}
					{errorList.length > 0 && (
						<ul className="list-disc pl-5">
							{errorList.map((msg) => (
								<li key={typeof msg === "string" ? msg : JSON.stringify(msg)}>
									{msg}
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			<form
				onSubmit={handleSubmit}
				className="mt-7 flex flex-col gap-5"
				autoComplete="off"
			>
				<div>
					<label
						htmlFor="new-password"
						className="mb-2 block text-sm font-bold"
					>
						{tr("reset_password.new_password_label", "New password")}
					</label>
					<div className="relative">
						<input
							id="new-password"
							name="new-password"
							type={showPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							aria-describedby={hasError ? "reset-error" : undefined}
							aria-invalid={!!error && touched.newPassword}
							placeholder={tr(
								"reset_password.new_password_label",
								"New password",
							)}
							value={form.newPassword}
							onChange={(e) => {
								setForm((f) => ({ ...f, newPassword: e.target.value }));
								setTouched((prev) => ({ ...prev, newPassword: true }));
							}}
							className="ink-field pr-12"
						/>
						<button
							type="button"
							onClick={() => setShowPassword((v) => !v)}
							aria-label={
								showPassword
									? tr("login.hide_password", "Hide password")
									: tr("login.show_password", "Show password")
							}
							className="absolute right-4 top-1/2 -translate-y-1/2"
							style={{ color: "var(--ink-soft)" }}
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					</div>
				</div>

				<div>
					<label
						htmlFor="confirm-password"
						className="mb-2 block text-sm font-bold"
					>
						{tr("reset_password.confirm_password_label", "Confirm password")}
					</label>
					<div className="relative">
						<input
							id="confirm-password"
							name="confirm-password"
							type={showConfirmPassword ? "text" : "password"}
							autoComplete="new-password"
							required
							aria-describedby={hasError ? "reset-error" : undefined}
							aria-invalid={!!error && touched.confirmPassword}
							placeholder={tr(
								"reset_password.confirm_password_label",
								"Confirm password",
							)}
							value={form.confirmPassword}
							onChange={(e) => {
								setForm((f) => ({ ...f, confirmPassword: e.target.value }));
								setTouched((prev) => ({ ...prev, confirmPassword: true }));
							}}
							className="ink-field pr-12"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword((v) => !v)}
							aria-label={
								showConfirmPassword
									? tr("login.hide_password", "Hide password")
									: tr("login.show_password", "Show password")
							}
							className="absolute right-4 top-1/2 -translate-y-1/2"
							style={{ color: "var(--ink-soft)" }}
						>
							{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					aria-busy={loading}
					className="ink-block ink-block--press display mt-1 w-full py-3.5 text-[1.15rem]"
					style={{
						background: "var(--surya)",
						color: "var(--on-fill)",
						cursor: loading ? "wait" : "pointer",
						opacity: loading ? 0.7 : 1,
					}}
				>
					{loading
						? tr("reset_password.submitting", "Updating...")
						: tr("reset_password.submit", "Update password")}
				</button>

				<Link to="/login" className="text-center text-sm font-bold underline">
					{tr("reset_password.back_to_login", "Back to login")}
				</Link>
			</form>
		</AuthShell>
	);
};

export default ResetPassword;

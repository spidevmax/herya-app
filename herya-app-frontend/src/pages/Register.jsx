import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AuthBrandHeader from "@/components/auth/AuthBrandHeader";
import { Button } from "@/components/ui";

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
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (form.password !== form.passwordConfirm) {
			setError(t("register.password_mismatch"));
			return;
		}

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
			setError(err?.response?.data?.message || t("register.error"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-dvh w-full px-4 py-8 sm:px-6 sm:py-10"
			style={{ background: "var(--gradient-primary)" }}
		>
			<div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md items-center justify-center">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35 }}
					className="w-full rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] sm:p-8"
				>
					<AuthBrandHeader />

					<div className="mb-7 text-center">
						<h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">
							{t("register.heading")}
						</h1>
					</div>

					{error && (
						<div role="alert" className="mb-4 rounded-xl px-4 py-3 text-sm font-medium bg-[var(--color-error-bg)] text-[var(--color-error-text)]">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
						<div className="relative">
							<User
								size={18}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
							/>
							<input
								type="text"
								autoComplete="name"
								required
								aria-label={t("register.full_name")}
								placeholder={t("register.full_name")}
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({ ...f, name: e.target.value }))
								}
								className="input-base pl-10 pr-4"
							/>
						</div>
						<div className="relative">
							<Mail
								size={18}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
							/>
							<input
								type="email"
								autoComplete="email"
								required
								aria-label={t("login.email_placeholder")}
								placeholder={t("login.email_placeholder")}
								value={form.email}
								onChange={(e) =>
									setForm((f) => ({ ...f, email: e.target.value }))
								}
								className="input-base pl-10 pr-4"
							/>
						</div>
						<div className="relative">
							<Lock
								size={18}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
							/>
							<input
								type={showPw ? "text" : "password"}
								autoComplete="new-password"
								required
								aria-label={t("register.password_placeholder")}
								placeholder={t("register.password_placeholder")}
								value={form.password}
								onChange={(e) =>
									setForm((f) => ({ ...f, password: e.target.value }))
								}
								className="input-base pl-10 pr-11"
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
						<div className="relative">
							<Lock
								size={18}
								className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
							/>
							<input
								type={showConfirmPw ? "text" : "password"}
								autoComplete="new-password"
								required
								aria-label={t("register.confirm_password")}
								placeholder={t("register.confirm_password")}
								value={form.passwordConfirm}
								onChange={(e) =>
									setForm((f) => ({ ...f, passwordConfirm: e.target.value }))
								}
								className="input-base pl-10 pr-11"
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
	);
}

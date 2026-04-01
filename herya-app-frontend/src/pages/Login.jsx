import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import { requestPasswordReset } from "@/api/auth.api";

export default function Login() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [form, setForm] = useState({ email: "", password: "" });
	const [showPw, setShowPw] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showForgot, setShowForgot] = useState(false);
	const [forgotEmail, setForgotEmail] = useState("");
	const [forgotLoading, setForgotLoading] = useState(false);
	const [forgotMessage, setForgotMessage] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			await login(form);
			navigate("/");
		} catch (err) {
			setError(err?.response?.data?.message || "Invalid credentials");
		} finally {
			setLoading(false);
		}
	};

	const handleForgotSubmit = async (e) => {
		e.preventDefault();
		setForgotLoading(true);
		setForgotMessage("");
		try {
			await requestPasswordReset({ email: forgotEmail });
			setForgotMessage("Check your email for reset instructions");
			setTimeout(() => {
				setShowForgot(false);
				setForgotEmail("");
				setForgotMessage("");
			}, 2000);
		} catch (err) {
			setForgotMessage(
				err?.response?.data?.message || "Error sending reset email",
			);
		} finally {
			setForgotLoading(false);
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
					className="w-full rounded-2xl border bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-card)] sm:p-8"
					style={{ borderColor: "var(--color-border)" }}
				>
					{!showForgot ? (
						<>
							<div className="mb-7 text-center">
								<h1
									className="text-3xl font-semibold"
									style={{
										fontFamily: '"DM Sans", sans-serif',
										color: "var(--color-text-primary)",
									}}
								>
									Sign in
								</h1>
								<p
									className="mt-2 text-sm font-medium"
									style={{
										fontFamily: '"DM Sans", sans-serif',
										color: "var(--color-text-secondary)",
									}}
								>
									Access your practice dashboard.
								</p>
							</div>

							{error && (
								<div
									className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
									style={{
										backgroundColor: "var(--color-error-bg)",
										color: "var(--color-error-text)",
										fontFamily: '"DM Sans", sans-serif',
									}}
								>
									{error}
								</div>
							)}

							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								<div className="relative">
									<Mail
										size={18}
										className="absolute left-3.5 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-text-muted)" }}
									/>
									<input
										type="email"
										autoComplete="email"
										required
										placeholder="Email"
										value={form.email}
										onChange={(e) =>
											setForm((f) => ({ ...f, email: e.target.value }))
										}
										className="w-full rounded-xl border bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:ring-2"
										style={{
											borderColor: "var(--color-border)",
											fontFamily: '"DM Sans", sans-serif',
										}}
									/>
								</div>
								<div className="relative">
									<Lock
										size={18}
										className="absolute left-3.5 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-text-muted)" }}
									/>
									<input
										type={showPw ? "text" : "password"}
										autoComplete="current-password"
										required
										placeholder="Password"
										value={form.password}
										onChange={(e) =>
											setForm((f) => ({ ...f, password: e.target.value }))
										}
										className="w-full rounded-xl border bg-[var(--color-surface)] py-3 pl-10 pr-11 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:ring-2"
										style={{
											borderColor: "var(--color-border)",
											fontFamily: '"DM Sans", sans-serif',
										}}
									/>
									<button
										type="button"
										onClick={() => setShowPw((v) => !v)}
										className="absolute right-3.5 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-text-muted)" }}
									>
										{showPw ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>

								<div className="text-right">
									<button
										type="button"
										onClick={() => setShowForgot(true)}
										className="text-sm font-medium hover:underline"
										style={{
											color: "var(--color-primary)",
											fontFamily: '"DM Sans", sans-serif',
										}}
									>
										Forgot password?
									</button>
								</div>

								<Button
									type="submit"
									disabled={loading}
									className="mt-1 w-full"
								>
									{loading ? "Signing in..." : "Sign in"}
								</Button>
							</form>

							<p
								className="mt-6 text-center text-sm font-medium"
								style={{
									fontFamily: '"DM Sans", sans-serif',
									color: "var(--color-text-secondary)",
								}}
							>
								Don&apos;t have an account?{" "}
								<Link
									to="/register"
									className="font-semibold hover:underline"
									style={{ color: "var(--color-primary)" }}
								>
									Create one
								</Link>
							</p>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => setShowForgot(false)}
								className="mb-5 inline-flex items-center gap-2 text-sm font-medium hover:underline"
								style={{
									color: "var(--color-primary)",
									fontFamily: '"DM Sans", sans-serif',
								}}
							>
								<ArrowLeft size={16} /> Back to sign in
							</button>
							<h2
								className="text-2xl font-semibold"
								style={{
									fontFamily: '"DM Sans", sans-serif',
									color: "var(--color-text-primary)",
								}}
							>
								Reset password
							</h2>
							<p
								className="mt-2 mb-6 text-sm font-medium"
								style={{
									fontFamily: '"DM Sans", sans-serif',
									color: "var(--color-text-secondary)",
								}}
							>
								Enter your email and we will send a reset link.
							</p>

							{forgotMessage && (
								<div
									className="mb-4 rounded-xl px-4 py-3 text-sm font-medium text-center"
									style={{
										backgroundColor:
											forgotMessage.includes("Check") ||
											forgotMessage.includes("sent")
												? "var(--color-info)"
												: "var(--color-error-bg)",
										color:
											forgotMessage.includes("Check") ||
											forgotMessage.includes("sent")
												? "white"
												: "var(--color-error-text)",
										fontFamily: '"DM Sans", sans-serif',
									}}
								>
									{forgotMessage}
								</div>
							)}

							<form
								onSubmit={handleForgotSubmit}
								className="flex flex-col gap-4"
							>
								<div className="relative">
									<Mail
										size={18}
										className="absolute left-3.5 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-text-muted)" }}
									/>
									<input
										type="email"
										autoComplete="email"
										required
										placeholder="Email"
										value={forgotEmail}
										onChange={(e) => setForgotEmail(e.target.value)}
										className="w-full rounded-xl border bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm font-medium text-[var(--color-text-primary)] outline-none transition focus:ring-2"
										style={{
											borderColor: "var(--color-border)",
											fontFamily: '"DM Sans", sans-serif',
										}}
									/>
								</div>
								<Button
									type="submit"
									disabled={forgotLoading}
									className="w-full"
								>
									{forgotLoading ? "Sending..." : "Send reset link"}
								</Button>
							</form>
						</>
					)}
				</motion.div>
			</div>
		</div>
	);
}

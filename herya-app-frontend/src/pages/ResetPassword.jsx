import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import { resetPassword } from "@/api/auth.api";

export default function ResetPassword() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token") || "";
	const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!token) {
			setError("Invalid or missing reset token");
			return;
		}

		if (form.newPassword !== form.confirmPassword) {
			setError("Passwords don't match");
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
			setError(err?.response?.data?.message || "Password reset failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-dvh flex flex-col items-center justify-center px-6 overflow-hidden"
			style={{
				background:
					"linear-gradient(135deg, #FFD89B 0%, #E8F4D0 50%, #FFD7E8 100%)",
				fontFamily: '"Fredoka", sans-serif',
			}}
		>
			<div className="absolute top-[6%] left-[8%] w-20 h-20 rounded-full bg-white/25 blur-xl" />
			<div className="absolute bottom-[12%] right-[10%] w-24 h-24 rounded-full bg-[var(--color-secondary)]/20 blur-xl" />

			<motion.div
				initial={{ opacity: 0, y: 24 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="w-full max-w-sm relative z-10"
			>
				{/* Form View */}
				{!success && (
					<>
						<button
							type="button"
							onClick={() => navigate("/login")}
							className="flex items-center gap-2 mb-6 hover:opacity-70 transition font-bold text-lg"
							style={{ color: "var(--color-primary)" }}
						>
							<ArrowLeft size={20} />
							Back
						</button>

						<div className="text-center mb-8">
							<Lock
								size={54}
								className="mb-4 inline-block"
								style={{ color: "var(--color-primary)" }}
							/>
							<h1
								className="text-4xl font-bold mb-2"
								style={{
									color: "var(--color-primary)",
									fontFamily: '"Fredoka", sans-serif',
								}}
							>
								New password
							</h1>
							<p
								className="text-sm"
								style={{
									color: "var(--color-text-secondary)",
									fontFamily: '"DM Sans", sans-serif',
								}}
							>
								Enter your new secure password
							</p>
						</div>

						{/* Card */}
						<motion.div
							className="rounded-4xl p-8 backdrop-blur-sm border-4"
							style={{
								backgroundColor: "var(--color-surface-card)",
								borderColor: "var(--color-secondary)",
								borderWidth: "3px",
								boxShadow: "0 10px 40px rgba(255, 184, 77, 0.25)",
							}}
							whileHover={{
								y: -8,
								scale: 1.02,
								boxShadow: "0 15px 50px rgba(255, 184, 77, 0.35)",
							}}
						>
							{error && (
								<motion.div
									initial={{ opacity: 0, y: -8, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									className="mb-4 px-5 py-4 rounded-3xl text-sm font-semibold"
									style={{
										backgroundColor: "var(--color-error-bg)",
										color: "var(--color-error-text)",
										borderLeft: "5px solid var(--color-accent)",
										fontFamily: '"DM Sans", sans-serif',
									}}
								>
									{error}
								</motion.div>
							)}

							<form onSubmit={handleSubmit} className="flex flex-col gap-5">
								{/* New Password */}
								<div className="relative">
									<Lock
										size={20}
										className="absolute left-4 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-primary)" }}
									/>
									<input
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										required
										placeholder="••••••••"
										value={form.newPassword}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												newPassword: e.target.value,
											}))
										}
										className="w-full pl-12 pr-12 py-4 rounded-3xl text-sm font-semibold focus:outline-none transition-all duration-200"
										style={{
											borderColor: "var(--color-border)",
											border: "2px solid",
											backgroundColor: "var(--color-surface)",
											color: "var(--color-text-primary)",
										}}
										onFocus={(e) => {
											e.style.borderColor = "var(--color-primary)";
											e.style.boxShadow = "0 0 0 4px rgba(93, 184, 127, 0.15)";
										}}
										onBlur={(e) => {
											e.style.borderColor = "var(--color-border)";
											e.style.boxShadow = "none";
										}}
									/>
									<button
										type="button"
										onClick={() => setShowPassword((v) => !v)}
										className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
										style={{ color: "var(--color-primary)" }}
									>
										{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>

								{/* Confirm Password */}
								<div className="relative">
									<Lock
										size={20}
										className="absolute left-4 top-1/2 -translate-y-1/2"
										style={{ color: "var(--color-primary)" }}
									/>
									<input
										type={showConfirmPassword ? "text" : "password"}
										autoComplete="new-password"
										required
										placeholder="••••••••"
										value={form.confirmPassword}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												confirmPassword: e.target.value,
											}))
										}
										className="w-full pl-12 pr-12 py-4 rounded-3xl text-sm font-semibold focus:outline-none transition-all duration-200"
										style={{
											borderColor: "var(--color-border)",
											border: "2px solid",
											backgroundColor: "var(--color-surface)",
											color: "var(--color-text-primary)",
										}}
										onFocus={(e) => {
											e.style.borderColor = "var(--color-primary)";
											e.style.boxShadow = "0 0 0 4px rgba(93, 184, 127, 0.15)";
										}}
										onBlur={(e) => {
											e.style.borderColor = "var(--color-border)";
											e.style.boxShadow = "none";
										}}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword((v) => !v)}
										className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
										style={{ color: "var(--color-primary)" }}
									>
										{showConfirmPassword ? (
											<EyeOff size={20} />
										) : (
											<Eye size={20} />
										)}
									</button>
								</div>

								{/* Submit Button */}
								<motion.button
									type="submit"
									disabled={loading}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className="mt-4 font-bold text-lg py-4 rounded-3xl text-white transition-all disabled:opacity-50"
									style={{
										backgroundColor: "var(--color-primary)",
										boxShadow: "var(--shadow-button)",
									}}
								>
									{loading ? "Resetting..." : "Reset Password"}
								</motion.button>
							</form>

							{/* Back Link */}
							<p
								className="text-center text-sm mt-6 font-semibold"
								style={{ color: "var(--color-text-secondary)" }}
							>
								<Link
									to="/login"
									className="font-bold hover:underline transition"
									style={{ color: "var(--color-secondary)" }}
								>
									Back to login
								</Link>
							</p>
						</motion.div>
					</>
				)}

				{/* Success State */}
				{success && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-4xl p-8 border-4 backdrop-blur-sm"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-secondary)",
							borderWidth: "3px",
							boxShadow: "0 10px 40px rgba(255, 184, 77, 0.25)",
						}}
					>
						<div className="text-center">
							<Lock
								size={46}
								className="mb-4 inline-block"
								style={{ color: "var(--color-primary)" }}
							/>
							<h2
								className="text-3xl font-bold mb-3"
								style={{
									color: "var(--color-primary)",
									fontFamily: '"Fredoka", sans-serif',
								}}
							>
								All set
							</h2>
							<p
								className="text-sm mb-6 font-semibold"
								style={{
									color: "var(--color-text-secondary)",
									fontFamily: '"DM Sans", sans-serif',
								}}
							>
								Your password has been successfully reset. Redirecting to
								login...
							</p>
							<Link
								to="/login"
								className="inline-block font-bold py-4 px-8 rounded-3xl transition hover:opacity-80"
								style={{
									backgroundColor: "var(--color-primary)",
									color: "white",
									boxShadow: "var(--shadow-button)",
								}}
							>
								Back to login
							</Link>
						</div>
					</motion.div>
				)}
			</motion.div>
		</div>
	);
}

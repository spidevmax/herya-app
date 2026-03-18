// Common UI primitives
import { motion } from "framer-motion";

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick, hover = true }) {
	return (
		<motion.div
			onClick={onClick}
			whileHover={
				hover && onClick
					? { y: -2, boxShadow: "0 8px 32px rgba(74,114,255,0.16)" }
					: {}
			}
			whileTap={onClick ? { scale: 0.98 } : {}}
			className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(74,114,255,0.08)] ${onClick ? "cursor-pointer" : ""} ${className}`}
		>
			{children}
		</motion.div>
	);
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({
	children,
	variant = "primary",
	size = "md",
	className = "",
	disabled = false,
	loading = false,
	...props
}) {
	const variants = {
		primary:
			"bg-[#4A72FF] text-white shadow-[0_4px_14px_rgba(74,114,255,0.35)] hover:bg-[#2952E3] active:scale-95",
		secondary:
			"bg-[#FFB347] text-white shadow-[0_4px_14px_rgba(255,179,71,0.35)] hover:bg-[#E8922A] active:scale-95",
		accent:
			"bg-[#5DB075] text-white shadow-[0_4px_14px_rgba(93,176,117,0.35)] hover:bg-[#3D8A55] active:scale-95",
		ghost:
			"bg-transparent text-[#4A72FF] hover:bg-[#4A72FF]/10 active:scale-95",
		outline:
			"border-2 border-[#E8E4DE] bg-white text-[#1A1A2E] hover:border-[#4A72FF] hover:text-[#4A72FF] active:scale-95",
	};
	const sizes = {
		sm: "px-3 py-1.5 text-sm rounded-xl",
		md: "px-5 py-2.5 text-sm rounded-2xl",
		lg: "px-6 py-3.5 text-base rounded-2xl",
		xl: "px-8 py-4 text-lg rounded-2xl",
	};
	return (
		<button
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
			{...props}
		>
			{loading ? <LoadingSpinner size={16} /> : children}
		</button>
	);
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "#4A72FF", className = "" }) {
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
			style={{ backgroundColor: `${color}20`, color }}
		>
			{children}
		</span>
	);
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 3, className = "" }) {
	return (
		<div
			className={`bg-white rounded-2xl p-4 space-y-3 shadow-[0_2px_16px_rgba(74,114,255,0.08)] ${className}`}
		>
			<div className="skeleton h-5 w-3/4 rounded-lg" />
			{Array.from({ length: lines - 1 }).map((_, i) => (
				<div
					key={i}
					className={`skeleton h-4 rounded-lg ${i === lines - 2 ? "w-1/2" : "w-full"}`}
				/>
			))}
		</div>
	);
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20, color = "currentColor" }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			className="animate-spin"
		>
			<circle
				cx="12"
				cy="12"
				r="10"
				stroke={color}
				strokeWidth="3"
				strokeLinecap="round"
				strokeDasharray="31.4"
				strokeDashoffset="10"
			/>
		</svg>
	);
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
	title,
	description,
	illustration = "🌱",
	action,
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center text-center py-16 px-6"
		>
			<motion.div className="text-6xl mb-4 float" animate={{}} style={{}}>
				{illustration}
			</motion.div>
			<h3 className="font-display text-xl font-semibold text-[#1A1A2E] mb-2">
				{title}
			</h3>
			{description && (
				<p className="text-[#6B7280] text-sm max-w-xs mb-6">{description}</p>
			)}
			{action}
		</motion.div>
	);
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = "#4A72FF", className = "" }) {
	const pct = Math.min(100, Math.round((value / max) * 100));
	return (
		<div
			className={`w-full h-2 bg-[#E8E4DE] rounded-full overflow-hidden ${className}`}
		>
			<motion.div
				initial={{ width: 0 }}
				animate={{ width: `${pct}%` }}
				transition={{ duration: 0.8, ease: "easeOut" }}
				className="h-full rounded-full"
				style={{ backgroundColor: color }}
			/>
		</div>
	);
}

// ── CircleProgress ────────────────────────────────────────────────────────────
export function CircleProgress({
	value,
	max,
	size = 64,
	stroke = 6,
	color = "#4A72FF",
	children,
}) {
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	const pct = Math.min(1, value / max);
	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="#E8E4DE"
					strokeWidth={stroke}
				/>
				<motion.circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={circ}
					initial={{ strokeDashoffset: circ }}
					animate={{ strokeDashoffset: circ * (1 - pct) }}
					transition={{ duration: 1, ease: "easeOut" }}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				{children}
			</div>
		</div>
	);
}

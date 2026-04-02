// Common UI primitives
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", onClick, hover = true }) {
	return (
		<motion.div
			onClick={onClick}
			whileHover={
				hover && onClick ? { y: -2, boxShadow: "var(--shadow-card-hover)" } : {}
			}
			whileTap={onClick ? { scale: 0.98 } : {}}
			className={`bg-white rounded-2xl shadow-[var(--shadow-card)] ${onClick ? "cursor-pointer" : ""} ${className}`}
		>
			{children}
		</motion.div>
	);
}

// ── SearchBar ────────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = "Search..." }) => {
	return (
		<div className="relative">
			<Search
				size={18}
				className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
			/>
			<input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] py-3 pl-11 pr-11 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
			/>
			{value ? (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Clear search"
					className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
					<X size={16} />
				</button>
			) : null}
		</div>
	);
};

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
			"bg-[var(--color-primary)] text-white shadow-[var(--shadow-button)] hover:brightness-95 active:scale-95",
		secondary:
			"bg-[var(--color-secondary)] text-white shadow-[var(--shadow-secondary)] hover:brightness-95 active:scale-95",
		accent:
			"bg-[var(--color-accent)] text-white shadow-[var(--shadow-accent)] hover:brightness-95 active:scale-95",
		ghost:
			"bg-transparent text-[var(--color-primary)] hover:bg-[color:var(--color-primary)/0.1] active:scale-95",
		outline:
			"border-2 border-[var(--color-border)] bg-white text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95",
	};
	const sizes = {
		sm: "px-3 py-1.5 text-sm rounded-lg",
		md: "px-5 py-2.5 text-sm rounded-xl",
		lg: "px-6 py-3.5 text-base rounded-xl",
		xl: "px-8 py-4 text-lg rounded-xl",
	};
	const weightClass =
		variant === "primary" || variant === "accent"
			? "font-semibold"
			: "font-medium";
	return (
		<button
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center gap-2 ${weightClass} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
			{...props}
		>
			{loading ? <LoadingSpinner size={16} /> : children}
		</button>
	);
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({
	icon,
	label,
	value,
	color = "var(--color-primary)",
}) => {
	return (
		<div
			className="rounded-xl p-3 flex flex-col gap-2"
			style={{
				backgroundColor: `${color}15`,
				borderLeft: `3px solid ${color}`,
			}}
		>
			<div className="flex items-center gap-2" style={{ color }}>
				{icon}
				<p className="text-xs font-medium text-[var(--color-text-secondary)]">
					{label}
				</p>
			</div>
			<p
				className="text-xl font-bold"
				style={{ color: "var(--color-text-primary)" }}
			>
				{value}
			</p>
		</div>
	);
};

// ── TabBar ────────────────────────────────────────────────────────────────────
export const TabBar = ({ tabs, active, onSelect, className = "" }) => {
	return (
		<div
			className={`flex gap-2 border-b border-[var(--color-border)] ${className}`}
		>
			{tabs.map((tab) => {
				const tabId = tab.id ?? tab.key;
				return (
					<button
						type="button"
						key={tabId}
						onClick={() => onSelect(tabId)}
						className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
							active === tabId
								? "border-[var(--color-primary)] text-[var(--color-primary)]"
								: "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
						}`}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
};

// ── MoodSelector ──────────────────────────────────────────────────────────────
const MOOD_EMOJIS = {
	energized: "⚡",
	calm: "🌙",
	focused: "🎯",
	tired: "😴",
	stiff: "🪨",
	peaceful: "🕉️",
	grateful: "🙏",
	anxious: "🌀",
};

export const MoodSelector = ({ value, onChange, label }) => {
	const { t } = useLanguage();
	const moods = Object.keys(MOOD_EMOJIS);

	return (
		<div className="flex flex-col gap-3">
			{label && (
				<p className="text-sm font-medium text-[var(--color-text-primary)]">
					{label}
				</p>
			)}
			<div className="grid grid-cols-4 gap-2">
				{moods.map((mood) => (
					<motion.button
						key={mood}
						type="button"
						onClick={() => onChange(mood)}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all text-xs font-medium ${
							value === mood
								? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]"
								: "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-soft)]"
						}`}
					>
						<span className="text-2xl mb-1">{MOOD_EMOJIS[mood]}</span>
						<span>{t(`session.moods.${mood}`)}</span>
					</motion.button>
				))}
			</div>
		</div>
	);
};

// ── FilterChips ───────────────────────────────────────────────────────────────
export const FilterChips = ({ options, selected, onSelect }) => {
	return (
		<div className="flex gap-2 flex-wrap">
			{options.map((option) => (
				<motion.button
					key={option.key}
					type="button"
					onClick={() => onSelect(option.key)}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
						selected === option.key
							? "text-white shadow-[var(--shadow-card)]"
							: "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border border-[var(--color-border-soft)]"
					}`}
					style={
						selected === option.key ? { backgroundColor: option.color } : {}
					}
				>
					{option.label}
				</motion.button>
			))}
		</div>
	);
};

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "#5DB87F", className = "" }) {
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
			className={`bg-white rounded-2xl p-4 space-y-3 shadow-[var(--shadow-card)] ${className}`}
		>
			<div className="skeleton h-5 w-3/4 rounded-lg" />
			{Array.from({ length: lines - 1 }, (_, idx) => idx + 1).map((lineNo) => (
				<div
					key={`skeleton-line-${lineNo}`}
					className={`skeleton h-4 rounded-lg ${lineNo === lines - 1 ? "w-1/2" : "w-full"}`}
				/>
			))}
		</div>
	);
}

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20, color = "currentColor" }) {
	const { t } = useLanguage();
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			className="animate-spin"
		>
			<title>{t("ui.loading")}</title>
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
	illustration = null,
	action,
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center text-center py-16 px-6"
		>
			{illustration ? (
				<motion.div className="text-6xl mb-4 float" animate={{}} style={{}}>
					{illustration}
				</motion.div>
			) : null}
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
export function ProgressBar({ value, max, color = "#5DB87F", className = "" }) {
	const pct = Math.min(100, Math.round((value / max) * 100));
	return (
		<div
			className={`w-full h-2 bg-[#E8F4D0] rounded-full overflow-hidden ${className}`}
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
	color = "#5DB87F",
	children,
}) {
	const { t } = useLanguage();
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	const pct = Math.min(1, value / max);
	return (
		<div
			className="relative inline-flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<title>{t("ui.progress")}</title>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="#E8F4D0"
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

// ── ConfirmModal ─────────────────────────────────────────────────────────────
export const ConfirmModal = ({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel,
	cancelLabel,
	danger = false,
	loading = false,
	confirmPhrase,
}) => {
	const { t } = useLanguage();
	const [phraseInput, setPhraseInput] = useState("");
	const resolvedConfirmLabel = confirmLabel ?? t("ui.confirm");
	const resolvedCancelLabel = cancelLabel ?? t("ui.cancel");
	const closeAriaLabel = t("ui.close_modal");
	const confirmBlocked = confirmPhrase ? phraseInput !== confirmPhrase : false;

	useEffect(() => {
		if (!open) setPhraseInput("");
	}, [open]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
		>
			<button
				type="button"
				aria-label={closeAriaLabel}
				className="absolute inset-0 bg-black/40"
				onClick={loading ? undefined : onClose}
			/>

			<motion.div
				initial={{ opacity: 0, y: 12, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="relative w-full max-w-md rounded-2xl p-6 shadow-[var(--shadow-card-hover)]"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
					{title}
				</h3>
				{description ? (
					<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
						{description}
					</p>
				) : null}

				{confirmPhrase ? (
					<div className="mt-4 space-y-1.5">
						<p
							className="text-xs font-medium"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("ui.type_to_confirm", { phrase: confirmPhrase })}
						</p>
						<input
							type="text"
							value={phraseInput}
							onChange={(e) => setPhraseInput(e.target.value)}
							placeholder={confirmPhrase}
							className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
							style={{
								backgroundColor: "var(--color-surface)",
								borderColor: confirmBlocked
									? "var(--color-border)"
									: "var(--color-danger)",
								color: "var(--color-text-primary)",
							}}
						/>
					</div>
				) : null}

				<div className="mt-6 flex justify-end gap-2">
					<Button variant="outline" onClick={onClose} disabled={loading}>
						{resolvedCancelLabel}
					</Button>
					<Button
						variant={danger ? "secondary" : "primary"}
						onClick={onConfirm}
						disabled={loading || confirmBlocked}
						loading={loading}
						style={
							danger
								? { backgroundColor: "var(--color-danger)", boxShadow: "none" }
								: {}
						}
					>
						{resolvedConfirmLabel}
					</Button>
				</div>
			</motion.div>
		</div>
	);
};

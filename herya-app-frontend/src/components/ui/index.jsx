// Common UI primitives
import { useEffect, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	BedSingle,
	Circle,
	Heart,
	Leaf,
	Moon,
	Search,
	Target,
	Wind,
	X,
	Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = "", onClick, hover = true, ...props }) => {
	const Component = onClick ? motion.button : motion.div;

	return (
		<Component
			type={onClick ? "button" : undefined}
			onClick={onClick}
			whileHover={
				hover && onClick ? { y: -2, boxShadow: "var(--shadow-card-hover)" } : {}
			}
			whileTap={onClick ? { scale: 0.98 } : {}}
			className={`section-card ${onClick ? "cursor-pointer text-left" : ""} ${className}`}
			{...props}
		>
			{children}
		</Component>
	);
};

// ── SearchBar ────────────────────────────────────────────────────────────────
export const SearchBar = ({
	value,
	onChange,
	placeholder = "Search...",
	clearLabel = "Clear search",
	label,
	className = "",
}) => {
	return (
		<div className={`relative ${className}`}>
			{label ? <label className="sr-only">{label}</label> : null}
			<Search
				size={18}
				className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
				aria-hidden="true"
			/>
			<input
				type="search"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				aria-label={label || placeholder}
				className="input-base bg-[var(--color-surface-card)] pr-11"
			/>
			{value ? (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label={clearLabel}
					className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
						<X size={16} aria-hidden="true" />
					</button>
				) : null}
		</div>
	);
};

export const Input = ({
	id,
	label,
	className = "",
	inputClassName = "",
	type = "text",
	...props
}) => (
	<div className={className}>
		{label ? (
			<label
				htmlFor={id}
				className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
			>
				{label}
			</label>
		) : null}
		<input id={id} type={type} className={`input-base px-4 ${inputClassName}`} {...props} />
	</div>
);

export const SelectField = ({
	id,
	label,
	className = "",
	children,
	...props
}) => (
	<div className={className}>
		{label ? (
			<label
				htmlFor={id}
				className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]"
			>
				{label}
			</label>
		) : null}
		<select id={id} className="select-base" {...props}>
			{children}
		</select>
	</div>
);

export const ChipButton = ({
	children,
	active = false,
	className = "",
	...props
}) => (
	<button
		type="button"
		className={`chip ${active ? "chip-active" : "chip-inactive"} border border-[var(--color-border-soft)] ${className}`}
		{...props}
	>
		{children}
	</button>
);

// ── Button ────────────────────────────────────────────────────────────────────
export const Button = ({
	children,
	variant = "primary",
	size = "md",
	className = "",
	disabled = false,
	loading = false,
	...props
}) => {
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
			"border-2 border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] active:scale-95",
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
			type={props.type || "button"}
			disabled={disabled || loading}
			className={`inline-flex items-center justify-center gap-2 ${weightClass} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
			{...props}
		>
			{loading ? <LoadingSpinner size={16} /> : children}
		</button>
	);
};

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
export const TabBar = ({
	tabs,
	active,
	onSelect,
	className = "",
	ariaLabel = "Tabs",
	idBase = "tabbar",
}) => {
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className={`flex gap-2 border-b border-[var(--color-border)] ${className}`}
		>
			{tabs.map((tab, index) => {
				const tabId = tab.id ?? tab.key;
				return (
					<button
						type="button"
						key={tabId}
						role="tab"
						id={`${idBase}-${tabId}-tab`}
						aria-controls={`${idBase}-${tabId}-panel`}
						aria-selected={active === tabId}
						tabIndex={active === tabId ? 0 : -1}
						onClick={() => onSelect(tabId)}
						onKeyDown={(event) => {
							if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
							event.preventDefault();
							const nextIndex =
								event.key === "ArrowRight"
									? (index + 1) % tabs.length
									: (index - 1 + tabs.length) % tabs.length;
							onSelect(tabs[nextIndex].id ?? tabs[nextIndex].key);
						}}
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
const MOOD_ICONS = {
	energized: Zap,
	calm: Moon,
	focused: Target,
	tired: BedSingle,
	stiff: Circle,
	peaceful: Leaf,
	grateful: Heart,
	anxious: Wind,
};

export const MoodSelector = ({ value, onChange, label }) => {
	const { t } = useLanguage();
	const moods = Object.keys(MOOD_ICONS);

	return (
		<div className="flex flex-col gap-3">
			{label && (
				<p className="text-sm font-medium text-[var(--color-text-primary)]">
					{label}
				</p>
			)}
			<div className="grid grid-cols-4 gap-2">
				{moods.map((mood) => {
					const MoodIcon = MOOD_ICONS[mood] || Circle;
					return (
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
							<span className="mb-1">
								<MoodIcon size={20} strokeWidth={2.2} />
							</span>
							<span>{t(`session.moods.${mood}`)}</span>
						</motion.button>
					);
				})}
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
export const Badge = ({ children, color = "var(--color-secondary)", className = "" }) => {
	return (
		<span
			className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
			style={{ backgroundColor: `${color}20`, color }}
		>
			{children}
		</span>
	);
};

// ── SkeletonCard ──────────────────────────────────────────────────────────────
export const SkeletonCard = ({ lines = 3, className = "" }) => {
	return (
		<div
			className={`rounded-2xl p-4 space-y-3 shadow-[var(--shadow-card)] ${className}`}
			style={{ backgroundColor: "var(--color-surface-card)" }}
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
};

// ── LoadingSpinner ────────────────────────────────────────────────────────────
export const LoadingSpinner = ({ size = 20, color = "currentColor" }) => {
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
};

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState = ({
	title,
	description,
	illustration = null,
	icon = null,
	action,
	className = "",
}) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
		>
			{icon ? (
				<motion.div className="mb-4 float" animate={{}} style={{}}>
					{icon}
				</motion.div>
			) : illustration ? (
				<motion.div className="text-6xl mb-4 float" animate={{}} style={{}}>
					{illustration}
				</motion.div>
			) : null}
			<h3 className="font-display text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
				{title}
			</h3>
			{description && (
				<p className="text-[var(--color-text-secondary)] text-sm max-w-xs mb-6">
					{description}
				</p>
			)}
			{action}
		</motion.div>
	);
};

// ── ProgressBar ───────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, color = "var(--color-secondary)", className = "" }) => {
	const pct = Math.min(100, Math.round((value / max) * 100));
	return (
		<div
			className={`w-full h-2 rounded-full overflow-hidden ${className}`}
			style={{ backgroundColor: "var(--color-border-soft)" }}
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
};

// ── CircleProgress ────────────────────────────────────────────────────────────
export const CircleProgress = ({
	value,
	max,
	size = 64,
	stroke = 6,
	color = "var(--color-secondary)",
	children,
}) => {
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
					stroke="var(--color-border-soft)"
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
};

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
	const dialogRef = useRef(null);
	const resolvedConfirmLabel = confirmLabel ?? t("ui.confirm");
	const resolvedCancelLabel = cancelLabel ?? t("ui.cancel");
	const closeAriaLabel = t("ui.close_modal");
	const confirmBlocked = confirmPhrase ? phraseInput !== confirmPhrase : false;
	const titleId = "confirm-modal-title";
	const descId = description ? "confirm-modal-desc" : undefined;

	useEffect(() => {
		if (!open) setPhraseInput("");
	}, [open]);

	// Escape key handler
	useEffect(() => {
		if (!open || loading) return undefined;
		const handleKeyDown = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, loading, onClose]);

	// Focus trap
	const handleKeyDown = useCallback(
		(e) => {
			if (e.key !== "Tab" || !dialogRef.current) return;
			const focusable = dialogRef.current.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		},
		[],
	);

	if (!open) return null;

	return (
		<div
			ref={dialogRef}
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			aria-describedby={descId}
			onKeyDown={handleKeyDown}
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
				<h3
					id={titleId}
					className="font-display text-lg font-semibold text-[var(--color-text-primary)]"
				>
					{title}
				</h3>
				{description ? (
					<p
						id={descId}
						className="mt-2 text-sm text-[var(--color-text-secondary)]"
					>
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

// ── StickyHeader ─────────────────────────────────────────────────────────────
export const SurfaceCard = ({ children, className = "", ...props }) => (
	<div className={`section-card ${className}`} {...props}>
		{children}
	</div>
);

export const PageHeader = ({ title, description, className = "", titleClassName = "" }) => (
	<div className={`page-header ${className}`}>
		<h1 className={`text-display-md text-[var(--color-text-primary)] ${titleClassName}`}>
			{title}
		</h1>
		{description ? (
			<p className="text-body-sm text-[var(--color-text-secondary)]">{description}</p>
		) : null}
	</div>
);

export const StickyHeader = ({ onBack, title, children }) => {
	return (
		<div className="sticky-header">
			{onBack && (
				<button
					type="button"
					onClick={onBack}
					aria-label="Back"
					className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
				</button>
			)}
			{title && (
				<h1 className="text-title-md text-[var(--color-text-primary)]">
					{title}
				</h1>
			)}
			{children}
		</div>
	);
};

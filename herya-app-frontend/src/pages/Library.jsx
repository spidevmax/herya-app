import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBreathingPatterns } from "@/api/breathing.api";
import { getPoses } from "@/api/poses.api";
import { getSequences } from "@/api/sequences.api";
import { EmptyState, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

/* ─── Colour palettes per difficulty ─── */
const PALETTE = {
	beginner: {
		bg: "#E8F5E9",
		border: "#4CAF50",
		badge: "#4CAF50",
		stars: "#4CAF50",
		statBg: "#C8E6C9",
		dark: { bg: "#1B2E1B", border: "#4CAF50", badge: "#4CAF50", statBg: "#1F3320" },
	},
	intermediate: {
		bg: "#FFF8E1",
		border: "#FF9800",
		badge: "#FF9800",
		stars: "#FF9800",
		statBg: "#FFE0B2",
		dark: { bg: "#2E2200", border: "#FF9800", badge: "#FF9800", statBg: "#3A2B00" },
	},
	advanced: {
		bg: "#FCE4EC",
		border: "#E91E63",
		badge: "#E91E63",
		stars: "#E91E63",
		statBg: "#F8BBD9",
		dark: { bg: "#2E0018", border: "#E91E63", badge: "#E91E63", statBg: "#3A001E" },
	},
	default: {
		bg: "#EDE7F6",
		border: "#7C3AED",
		badge: "#7C3AED",
		stars: "#7C3AED",
		statBg: "#D1C4E9",
		dark: { bg: "#1A0A2E", border: "#9F67FF", badge: "#9F67FF", statBg: "#22103A" },
	},
};

const BREATHING_PALETTE = {
	calming: { bg: "#E3F2FD", border: "#2196F3", statBg: "#BBDEFB", dark: { bg: "#0A1929", border: "#2196F3", statBg: "#0D2137" } },
	energizing: { bg: "#FFF3E0", border: "#FF5722", statBg: "#FFCCBC", dark: { bg: "#2A0E00", border: "#FF5722", statBg: "#321500" } },
	balancing: { bg: "#F3E5F5", border: "#9C27B0", statBg: "#E1BEE7", dark: { bg: "#1A0024", border: "#9C27B0", statBg: "#21002D" } },
	cooling: { bg: "#E0F7FA", border: "#00BCD4", statBg: "#B2EBF2", dark: { bg: "#00181C", border: "#00BCD4", statBg: "#001F24" } },
	heating: { bg: "#FBE9E7", border: "#FF3D00", statBg: "#FFCCBC", dark: { bg: "#2A0600", border: "#FF3D00", statBg: "#330800" } },
	default: { bg: "#E8EAF6", border: "#3F51B5", statBg: "#C5CAE9", dark: { bg: "#070B29", border: "#3F51B5", statBg: "#0B1033" } },
};

function getPalette(item, type, isDark) {
	if (type === "breathing") {
		const p = BREATHING_PALETTE[item.energyEffect] ?? BREATHING_PALETTE.default;
		return isDark ? { ...p, ...p.dark } : p;
	}
	const p = PALETTE[item.difficulty] ?? PALETTE.default;
	return isDark ? { ...p, ...p.dark } : p;
}

function diffStars(difficulty) {
	const map = { beginner: 1, intermediate: 2, advanced: 3 };
	return map[difficulty] ?? 1;
}

function Stars({ count, color }) {
	return (
		<span className="text-sm tracking-tight" style={{ color }}>
			{"★".repeat(count)}{"☆".repeat(3 - count)}
		</span>
	);
}

function StatBox({ value, label, bg, color }) {
	return (
		<div
			className="flex flex-col items-center justify-center rounded-xl px-2 py-1.5 min-w-[44px]"
			style={{ backgroundColor: bg }}
		>
			<span className="text-sm font-bold leading-none" style={{ color, fontFamily: '"Fredoka", sans-serif' }}>
				{value}
			</span>
			<span className="text-[8px] font-semibold uppercase tracking-wide mt-0.5 leading-none" style={{ color }}>
				{label}
			</span>
		</div>
	);
}

/* ─── Retro Trading Card ─── */
function RetroCard({ item, type, index, onClick, isDark }) {
	const pal = getPalette(item, type, isDark);

	const title = item.englishName || item.name || item.romanizationName || "Item";
	const subtitle = item.romanizationName || item.sanskritName || item.romanizedName || "";
	const cardNum = String(index + 1).padStart(3, "0");

	/* Emoji icon */
	let icon = "🧘";
	if (type === "poses") {
		const cat = item.vkCategory?.primary ?? "";
		if (cat.includes("inverted")) icon = "🤸";
		else if (cat.includes("seated")) icon = "🪷";
		else if (cat.includes("balance")) icon = "🦩";
		else if (cat.includes("backbend")) icon = "🌉";
		else if (cat.includes("supine") || cat.includes("prone")) icon = "😴";
		else icon = "💪";
	} else if (type === "breathing") {
		const fx = item.energyEffect ?? "";
		const emap = { calming: "🌊", energizing: "⚡", balancing: "☯️", cooling: "❄️", heating: "🔥" };
		icon = emap[fx] ?? "💨";
	}

	/* Stats row */
	let stats = [];
	if (type === "sequences") {
		stats = [
			{ value: item.level ?? "—", label: "LVL" },
			{ value: item.estimatedDuration?.recommended ?? item.estimatedDuration?.min ?? "—", label: "MIN" },
			{ value: (item.family ?? "VK").replace(/_/g, " ").slice(0, 4).toUpperCase(), label: "FAM" },
		];
	} else if (type === "poses") {
		const breaths = item.recommendedBreaths?.beginner?.min ?? item.recommendedBreaths?.beginner ?? "—";
		stats = [
			{ value: breaths, label: "BRTH" },
			{ value: item.sidedness?.type === "symmetric" ? "SYM" : "ASYM", label: "SIDE" },
			{ value: (item.vkCategory?.primary ?? "—").slice(0, 4).toUpperCase(), label: "CAT" },
		];
	} else if (type === "breathing") {
		const r = item.patternRatio ?? {};
		stats = [
			{ value: `${r.inhale ?? 1}:${r.exhale ?? 1}`, label: "RATIO" },
			{ value: item.baseBreathDuration ?? "—", label: "SEC" },
			{ value: (item.energyEffect ?? "—").slice(0, 4).toUpperCase(), label: "FX" },
		];
	}

	const borderColor = pal.border;
	const stars = type !== "breathing" ? diffStars(item.difficulty) : (item.difficulty === "advanced" ? 3 : item.difficulty === "intermediate" ? 2 : 1);

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.04 }}
			whileTap={{ scale: 0.97 }}
			onClick={onClick}
			className="w-full text-left"
		>
			{/* Card outer — thick border, retro style */}
			<div
				className="rounded-3xl overflow-hidden"
				style={{
					border: `4px solid ${borderColor}`,
					backgroundColor: pal.bg,
					boxShadow: `4px 4px 0px ${borderColor}`,
				}}
			>
				{/* Top strip: type label + stars */}
				<div
					className="flex items-center justify-between px-3 py-1.5"
					style={{ backgroundColor: borderColor }}
				>
					<span
						className="text-[10px] font-black uppercase tracking-[0.12em] text-white"
						style={{ fontFamily: '"Fredoka", sans-serif' }}
					>
						{type === "sequences" ? "VK SEQUENCE" : type === "poses" ? "ASANA" : "PRANAYAMA"}
					</span>
					<Stars count={stars} color="white" />
				</div>

				{/* Main body: icon area + info */}
				<div className="flex items-stretch gap-0">
					{/* Illustration block */}
					<div
						className="flex items-center justify-center text-5xl flex-shrink-0"
						style={{
							width: 88,
							minHeight: 88,
							backgroundColor: `${borderColor}22`,
							borderRight: `3px solid ${borderColor}`,
						}}
					>
						{item.image ? (
							<img src={item.image} alt={title} className="w-full h-full object-cover" />
						) : (
							icon
						)}
					</div>

					{/* Text area */}
					<div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-0.5">
						<h3
							className="font-black text-base leading-tight truncate"
							style={{ color: borderColor, fontFamily: '"Fredoka", sans-serif' }}
						>
							{title}
						</h3>
						{subtitle && subtitle !== title && (
							<p
								className="text-xs italic truncate font-medium"
								style={{ color: `${borderColor}bb` }}
							>
								{subtitle}
							</p>
						)}
						{item.description && (
							<p
								className="text-[11px] leading-snug mt-1 line-clamp-2"
								style={{ color: isDark ? "#aaa" : "#555" }}
							>
								{item.description}
							</p>
						)}
					</div>
				</div>

				{/* Bottom strip: stats + card number */}
				<div
					className="flex items-center justify-between px-3 py-2 gap-2"
					style={{ borderTop: `3px solid ${borderColor}`, backgroundColor: `${borderColor}11` }}
				>
					<div className="flex gap-1.5">
						{stats.map((s) => (
							<StatBox
								key={s.label}
								value={s.value}
								label={s.label}
								bg={pal.statBg}
								color={borderColor}
							/>
						))}
					</div>
					<span
						className="text-[10px] font-black tracking-wider flex-shrink-0"
						style={{ color: borderColor, fontFamily: '"Fredoka", sans-serif' }}
					>
						NO.{cardNum}
					</span>
				</div>
			</div>
		</motion.button>
	);
}

/* ─── Library page ─── */
export default function Library() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [tab, setTab] = useState("sequences");
	const [sequences, setSequences] = useState([]);
	const [poses, setPoses] = useState([]);
	const [breathing, setBreathing] = useState([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");

	/* Detect dark mode from html class */
	const [isDark, setIsDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);
	useEffect(() => {
		const obs = new MutationObserver(() =>
			setIsDark(document.documentElement.classList.contains("dark")),
		);
		obs.observe(document.documentElement, { attributeFilter: ["class"] });
		return () => obs.disconnect();
	}, []);

	const TABS = [
		{ key: "sequences", label: t("library.tabs_sequences"), emoji: "🧘" },
		{ key: "poses", label: t("library.tabs_poses"), emoji: "💪" },
		{ key: "breathing", label: t("library.tabs_breathing"), emoji: "💨" },
	];

	useEffect(() => {
		setLoading(true);
		setQuery("");

		if (tab === "sequences") {
			getSequences({ limit: 50 })
				.then((r) => {
					const list = r.data?.data?.sequences || r.data?.sequences || [];
					setSequences(Array.isArray(list) ? list : []);
				})
				.catch(() => setSequences([]))
				.finally(() => setLoading(false));
		} else if (tab === "poses") {
			getPoses({ limit: 60 })
				.then((r) => {
					const list = r.data?.data?.poses || r.data?.poses || [];
					setPoses(Array.isArray(list) ? list : []);
				})
				.catch(() => setPoses([]))
				.finally(() => setLoading(false));
		} else if (tab === "breathing") {
			getBreathingPatterns({ limit: 50 })
				.then((r) => {
					const list = r.data?.data?.patterns || r.data?.patterns || [];
					setBreathing(Array.isArray(list) ? list : []);
				})
				.catch(() => setBreathing([]))
				.finally(() => setLoading(false));
		}
	}, [tab]);

	const items =
		tab === "sequences" ? sequences : tab === "poses" ? poses : breathing;

	const filtered = items.filter((item) => {
		if (!query) return true;
		const haystack = [
			item.englishName,
			item.name,
			item.romanizationName,
			item.romanizedName,
			item.sanskritName,
		]
			.filter(Boolean)
			.join(" ")
			.toLowerCase();
		return haystack.includes(query.toLowerCase());
	});

	const handleCardClick = (item, type) => {
		if (type === "sequences") navigate(`/library/sequence/${item._id}`);
		else if (type === "poses") navigate(`/poses/${item._id}`);
		else if (type === "breathing") navigate(`/breathing/${item._id}`);
	};

	const emptyTitle =
		tab === "sequences"
			? t("library.empty_sequences")
			: tab === "poses"
				? t("library.empty_poses")
				: t("library.empty_patterns");
	const emptyHint =
		tab === "sequences"
			? t("library.empty_sequences_hint")
			: tab === "poses"
				? t("library.empty_poses_hint")
				: t("library.empty_patterns_hint");

	return (
		<div className="flex flex-col pt-4 pb-6 gap-4">
			{/* Header */}
			<div className="px-4">
				<h1
					className="text-3xl font-bold mb-1"
					style={{ color: "var(--color-text-primary)", fontFamily: '"Fredoka", sans-serif' }}
				>
					{t("library.title")}
				</h1>
				<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
					{t("library.tabs_sequences")} · {t("library.tabs_poses")} · {t("library.tabs_breathing")}
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 px-4 overflow-x-auto pb-1">
				{TABS.map((tb) => (
					<button
						key={tb.key}
						type="button"
						onClick={() => setTab(tb.key)}
						className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border-2"
						style={{
							backgroundColor:
								tab === tb.key ? "var(--color-secondary)" : "var(--color-surface-card)",
							color: tab === tb.key ? "white" : "var(--color-text-secondary)",
							borderColor:
								tab === tb.key ? "var(--color-secondary)" : "var(--color-border)",
							fontFamily: '"DM Sans", sans-serif',
						}}
					>
						{tb.emoji} {tb.label}
					</button>
				))}
			</div>

			{/* Search */}
			<div className="px-4">
				<div className="relative">
					<Search
						size={18}
						className="absolute left-4 top-1/2 -translate-y-1/2"
						style={{ color: "var(--color-text-muted)" }}
					/>
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={t("library.search")}
						className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none transition border-2"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border)",
							color: "var(--color-text-primary)",
							fontFamily: '"DM Sans", sans-serif',
						}}
						onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
						onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="px-4 flex-1">
				<AnimatePresence mode="wait">
					{loading ? (
						<div key="loading" className="flex flex-col gap-4">
							{["s1", "s2", "s3"].map((k) => (
								<SkeletonCard key={k} />
							))}
						</div>
					) : filtered.length === 0 ? (
						<motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
							<EmptyState illustration="🔍" title={emptyTitle} description={emptyHint} />
						</motion.div>
					) : (
						<motion.div
							key="content"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col gap-4"
						>
							{filtered.map((item, i) => (
								<RetroCard
									key={item._id || i}
									item={item}
									type={tab}
									index={i}
									isDark={isDark}
									onClick={() => handleCardClick(item, tab)}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

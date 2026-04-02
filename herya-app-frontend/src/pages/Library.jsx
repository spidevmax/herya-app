import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
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
		dark: {
			bg: "#1B2E1B",
			border: "#4CAF50",
			badge: "#4CAF50",
			statBg: "#1F3320",
		},
	},
	intermediate: {
		bg: "#FFF8E1",
		border: "#FF9800",
		badge: "#FF9800",
		stars: "#FF9800",
		statBg: "#FFE0B2",
		dark: {
			bg: "#2E2200",
			border: "#FF9800",
			badge: "#FF9800",
			statBg: "#3A2B00",
		},
	},
	advanced: {
		bg: "#FCE4EC",
		border: "#E91E63",
		badge: "#E91E63",
		stars: "#E91E63",
		statBg: "#F8BBD9",
		dark: {
			bg: "#2E0018",
			border: "#E91E63",
			badge: "#E91E63",
			statBg: "#3A001E",
		},
	},
	default: {
		bg: "#EDE7F6",
		border: "#7C3AED",
		badge: "#7C3AED",
		stars: "#7C3AED",
		statBg: "#D1C4E9",
		dark: {
			bg: "#1A0A2E",
			border: "#9F67FF",
			badge: "#9F67FF",
			statBg: "#22103A",
		},
	},
};

const BREATHING_PALETTE = {
	calming: {
		bg: "#E3F2FD",
		border: "#2196F3",
		statBg: "#BBDEFB",
		dark: { bg: "#0A1929", border: "#2196F3", statBg: "#0D2137" },
	},
	energizing: {
		bg: "#FFF3E0",
		border: "#FF5722",
		statBg: "#FFCCBC",
		dark: { bg: "#2A0E00", border: "#FF5722", statBg: "#321500" },
	},
	balancing: {
		bg: "#F3E5F5",
		border: "#9C27B0",
		statBg: "#E1BEE7",
		dark: { bg: "#1A0024", border: "#9C27B0", statBg: "#21002D" },
	},
	cooling: {
		bg: "#E0F7FA",
		border: "#00BCD4",
		statBg: "#B2EBF2",
		dark: { bg: "#00181C", border: "#00BCD4", statBg: "#001F24" },
	},
	heating: {
		bg: "#FBE9E7",
		border: "#FF3D00",
		statBg: "#FFCCBC",
		dark: { bg: "#2A0600", border: "#FF3D00", statBg: "#330800" },
	},
	default: {
		bg: "#E8EAF6",
		border: "#3F51B5",
		statBg: "#C5CAE9",
		dark: { bg: "#070B29", border: "#3F51B5", statBg: "#0B1033" },
	},
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
			{"★".repeat(count)}
			{"☆".repeat(3 - count)}
		</span>
	);
}

function StatBox({ value, label, bg, color }) {
	return (
		<div
			className="flex flex-col items-center justify-center rounded-xl px-2 py-1.5 min-w-[44px]"
			style={{ backgroundColor: bg }}
		>
			<span
				className="text-sm font-bold leading-none"
				style={{ color, fontFamily: '"Fredoka", sans-serif' }}
			>
				{value}
			</span>
			<span
				className="text-[8px] font-semibold uppercase tracking-wide mt-0.5 leading-none"
				style={{ color }}
			>
				{label}
			</span>
		</div>
	);
}

function collectSearchText(value, seen = new Set()) {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number")
		return String(value);
	if (typeof value !== "object" || seen.has(value)) return "";

	seen.add(value);

	if (Array.isArray(value)) {
		return value.map((entry) => collectSearchText(entry, seen)).join(" ");
	}

	return Object.values(value)
		.map((entry) => collectSearchText(entry, seen))
		.filter(Boolean)
		.join(" ");
}

function svgDataUri(svg) {
	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getMonogram(text, fallback) {
	const cleaned = String(text || "")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
	if (!cleaned) return fallback;
	return cleaned
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}

function getTabIconSrc(tabKey) {
	const config = {
		sequences: { bg: "#5DB87F", fg: "#FFFFFF", label: "VK" },
		poses: { bg: "#4A72FF", fg: "#FFFFFF", label: "AS" },
		breathing: { bg: "#FF8A3D", fg: "#FFFFFF", label: "PR" },
	}[tabKey] ?? { bg: "#7C3AED", fg: "#FFFFFF", label: "LB" };

	return svgDataUri(`
		<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
			<rect x="2" y="2" width="36" height="36" rx="12" fill="${config.bg}"/>
			<rect x="2" y="2" width="36" height="36" rx="12" fill="white" fill-opacity="0.08"/>
			<text x="20" y="24" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="12" font-weight="700" fill="${config.fg}">${config.label}</text>
		</svg>
	`);
}

function getItemIconSrc(item, type, title) {
	const fallbackLabel =
		type === "sequences" ? "VK" : type === "poses" ? "AS" : "PR";
	const monogram = getMonogram(title, fallbackLabel);
	const palette =
		type === "sequences"
			? { a: "#5DB87F", b: "#A9E5C0" }
			: type === "poses"
				? { a: "#4A72FF", b: "#97B2FF" }
				: { a: "#FF8A3D", b: "#FFC08F" };

	const accent = item.image ? "#ffffff" : "#ffffff";

	return svgDataUri(`
		<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
					<stop stop-color="${palette.a}"/>
					<stop offset="1" stop-color="${palette.b}"/>
				</linearGradient>
			</defs>
			<rect width="160" height="160" rx="32" fill="url(#g)"/>
			<circle cx="120" cy="36" r="18" fill="white" fill-opacity="0.16"/>
			<circle cx="38" cy="124" r="24" fill="white" fill-opacity="0.12"/>
			<text x="80" y="92" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="44" font-weight="800" fill="${accent}">${monogram}</text>
		</svg>
	`);
}

/* ─── Retro Trading Card ─── */
function RetroCard({
	item,
	type,
	index,
	onClick,
	isDark,
	typeLabel,
	fallbackItemLabel,
}) {
	const pal = getPalette(item, type, isDark);

	const title =
		item.englishName || item.name || item.romanizationName || fallbackItemLabel;
	const subtitle =
		item.romanizationName || item.sanskritName || item.romanizedName || "";
	const cardNum = String(index + 1).padStart(3, "0");

	const iconSrc = getItemIconSrc(item, type, title);

	/* Stats row */
	let stats = [];
	if (type === "sequences") {
		stats = [
			{ value: item.level ?? "—", label: "LVL" },
			{
				value:
					item.estimatedDuration?.recommended ??
					item.estimatedDuration?.min ??
					"—",
				label: "MIN",
			},
			{
				value: (item.family ?? "VK")
					.replace(/_/g, " ")
					.slice(0, 4)
					.toUpperCase(),
				label: "FAM",
			},
		];
	} else if (type === "poses") {
		const breaths =
			item.recommendedBreaths?.beginner?.min ??
			item.recommendedBreaths?.beginner ??
			"—";
		stats = [
			{ value: breaths, label: "BRTH" },
			{
				value: item.sidedness?.type === "symmetric" ? "SYM" : "ASYM",
				label: "SIDE",
			},
			{
				value: (item.vkCategory?.primary ?? "—").slice(0, 4).toUpperCase(),
				label: "CAT",
			},
		];
	} else if (type === "breathing") {
		const r = item.patternRatio ?? {};
		stats = [
			{ value: `${r.inhale ?? 1}:${r.exhale ?? 1}`, label: "RATIO" },
			{ value: item.baseBreathDuration ?? "—", label: "SEC" },
			{
				value: (item.energyEffect ?? "—").slice(0, 4).toUpperCase(),
				label: "FX",
			},
		];
	}

	const borderColor = pal.border;
	const stars =
		type !== "breathing"
			? diffStars(item.difficulty)
			: item.difficulty === "advanced"
				? 3
				: item.difficulty === "intermediate"
					? 2
					: 1;

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
						{typeLabel}
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
						<img
							src={item.image || iconSrc}
							alt={title}
							className="w-full h-full object-cover"
						/>
					</div>

					{/* Text area */}
					<div className="flex-1 px-3 py-2.5 flex flex-col justify-center gap-0.5">
						<h3
							className="font-black text-base leading-tight truncate"
							style={{
								color: borderColor,
								fontFamily: '"Fredoka", sans-serif',
							}}
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
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: `${borderColor}11`,
					}}
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
	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
	};
	const [tab, setTab] = useState("all");
	const [sequences, setSequences] = useState([]);
	const [poses, setPoses] = useState([]);
	const [breathing, setBreathing] = useState([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [difficultyFilter, setDifficultyFilter] = useState("all");
	const [effectFilter, setEffectFilter] = useState("all");

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

	useEffect(() => {
		if (!tab) return;
		setQuery("");
		setDifficultyFilter("all");
		setEffectFilter("all");
	}, [tab]);

	const allTabLabel = tr("library.tabs_all", "All");
	const difficultyLabel = (option) => {
		const labels = {
			all: tr("library.filters_all_difficulties", "All difficulties"),
			beginner: tr("library.beginner", "Beginner"),
			intermediate: tr("library.intermediate", "Intermediate"),
			advanced: tr("library.advanced", "Advanced"),
		};
		return labels[option] ?? option.charAt(0).toUpperCase() + option.slice(1);
	};
	const effectLabel = (option) => {
		const labels = {
			all: tr("library.filters_all_effects", "All effects"),
			calming: tr("library.effects.calming", "Calming"),
			energizing: tr("library.effects.energizing", "Energizing"),
			balancing: tr("library.effects.balancing", "Balancing"),
			cooling: tr("library.effects.cooling", "Cooling"),
			heating: tr("library.effects.heating", "Heating"),
		};
		return labels[option] ?? option;
	};
	const cardTypeLabel = (type) => {
		if (type === "sequences")
			return tr("library.card_type_sequence", "VK Sequence");
		if (type === "poses") return tr("library.card_type_pose", "Asana");
		if (type === "breathing")
			return tr("library.card_type_breathing", "Pranayama");
		return tr("library.card_type_default", "Library");
	};

	const TABS = [
		{ key: "all", label: allTabLabel },
		{ key: "sequences", label: t("library.tabs_sequences") },
		{ key: "poses", label: t("library.tabs_poses") },
		{ key: "breathing", label: t("library.tabs_breathing") },
	];

	useEffect(() => {
		setLoading(true);

		if (tab === "all") {
			Promise.all([
				getSequences({ limit: 50 }),
				getPoses({ limit: 60 }),
				getBreathingPatterns({ limit: 50 }),
			])
				.then(([seqRes, poseRes, breathRes]) => {
					const seqPayload = seqRes.data?.data || seqRes.data || {};
					const posePayload = poseRes.data?.data || poseRes.data || {};
					const breathPayload = breathRes.data?.data || breathRes.data || {};

					const seqList =
						seqPayload.sequences ??
						(Array.isArray(seqPayload) ? seqPayload : []);
					const poseList =
						posePayload.poses ??
						(Array.isArray(posePayload) ? posePayload : []);
					const breathList =
						breathPayload.patterns ??
						(Array.isArray(breathPayload) ? breathPayload : []);

					setSequences(Array.isArray(seqList) ? seqList : []);
					setPoses(Array.isArray(poseList) ? poseList : []);
					setBreathing(Array.isArray(breathList) ? breathList : []);
				})
				.catch(() => {
					setSequences([]);
					setPoses([]);
					setBreathing([]);
				})
				.finally(() => setLoading(false));
		} else if (tab === "sequences") {
			getSequences({ limit: 50 })
				.then((r) => {
					const payload = r.data?.data || r.data || {};
					const list =
						payload.sequences ?? (Array.isArray(payload) ? payload : []);
					setSequences(Array.isArray(list) ? list : []);
				})
				.catch(() => setSequences([]))
				.finally(() => setLoading(false));
		} else if (tab === "poses") {
			getPoses({ limit: 60 })
				.then((r) => {
					const payload = r.data?.data || r.data || {};
					const list = payload.poses ?? (Array.isArray(payload) ? payload : []);
					setPoses(Array.isArray(list) ? list : []);
				})
				.catch(() => setPoses([]))
				.finally(() => setLoading(false));
		} else if (tab === "breathing") {
			getBreathingPatterns({ limit: 50 })
				.then((r) => {
					const payload = r.data?.data || r.data || {};
					const list =
						payload.patterns ?? (Array.isArray(payload) ? payload : []);
					setBreathing(Array.isArray(list) ? list : []);
				})
				.catch(() => setBreathing([]))
				.finally(() => setLoading(false));
		}
	}, [tab]);

	const items =
		tab === "sequences"
			? sequences.map((item) => ({ ...item, __kind: "sequences" }))
			: tab === "poses"
				? poses.map((item) => ({ ...item, __kind: "poses" }))
				: tab === "breathing"
					? breathing.map((item) => ({ ...item, __kind: "breathing" }))
					: [
							...sequences.map((item) => ({ ...item, __kind: "sequences" })),
							...poses.map((item) => ({ ...item, __kind: "poses" })),
							...breathing.map((item) => ({ ...item, __kind: "breathing" })),
						];
	const difficultyOptions = [
		"all",
		...Array.from(
			new Set(
				items
					.map((item) => item.difficulty)
					.filter((value) => typeof value === "string" && value.length > 0),
			),
		),
	];
	const effectOptions = [
		"all",
		...Array.from(
			new Set(
				items
					.map((item) => item.energyEffect)
					.filter((value) => typeof value === "string" && value.length > 0),
			),
		),
	];
	const showDifficultyFilters =
		tab === "all" || tab === "sequences" || tab === "poses";
	const showEffectFilters = tab === "all" || tab === "breathing";

	const normalizedQuery = query.trim().toLowerCase();
	const filteredItems = items.filter((item) => {
		const textPass =
			normalizedQuery.length < 2
				? true
				: collectSearchText(item).toLowerCase().includes(normalizedQuery);
		const difficultyPass =
			difficultyFilter === "all" ? true : item.difficulty === difficultyFilter;
		const effectPass =
			effectFilter === "all" ? true : item.energyEffect === effectFilter;

		return textPass && difficultyPass && effectPass;
	});

	const isLoading = loading;

	const handleCardClick = (item, type) => {
		if (type === "sequences") navigate(`/library/sequence/${item._id}`);
		else if (type === "poses") navigate(`/poses/${item._id}`);
		else if (type === "breathing") navigate(`/breathing/${item._id}`);
		else if (item.__kind === "sequences")
			navigate(`/library/sequence/${item._id}`);
		else if (item.__kind === "poses") navigate(`/poses/${item._id}`);
		else if (item.__kind === "breathing") navigate(`/breathing/${item._id}`);
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
	const noResultsHint = tr("library.no_results", "No results found");
	const clearFiltersLabel = tr("library.clear_filters", "Clear filters");

	const handleTabChange = (nextTab) => {
		if (nextTab === tab) return;
		setLoading(true);
		setTab(nextTab);
	};

	return (
		<div className="flex flex-col pt-4 pb-6 gap-4">
			{/* Header */}
			<div className="px-4">
				<h1
					className="text-3xl font-bold mb-1"
					style={{
						color: "var(--color-text-primary)",
						fontFamily: '"Fredoka", sans-serif',
					}}
				>
					{t("library.title")}
				</h1>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 px-4 overflow-x-auto pb-1">
				{TABS.map((tb) => (
					<button
						key={tb.key}
						type="button"
						onClick={() => handleTabChange(tb.key)}
						className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border-2"
						style={{
							backgroundColor:
								tab === tb.key
									? "var(--color-secondary)"
									: "var(--color-surface-card)",
							color: tab === tb.key ? "white" : "var(--color-text-secondary)",
							borderColor:
								tab === tb.key
									? "var(--color-secondary)"
									: "var(--color-border)",
							fontFamily: '"DM Sans", sans-serif',
						}}
					>
						{tb.key !== "all" ? (
							<img
								src={getTabIconSrc(tb.key)}
								alt=""
								className="inline-block w-4 h-4 mr-2 align-[-2px]"
							/>
						) : null}
						{tb.label}
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
						onFocus={(e) => {
							e.target.style.borderColor = "var(--color-primary)";
						}}
						onBlur={(e) => {
							e.target.style.borderColor = "var(--color-border)";
						}}
					/>
				</div>
				<div className="mt-3 flex flex-col gap-2">
					{showDifficultyFilters ? (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{difficultyOptions.map((option) => (
								<button
									key={`difficulty-${option}`}
									type="button"
									onClick={() => setDifficultyFilter(option)}
									className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
									style={{
										backgroundColor:
											difficultyFilter === option
												? "var(--color-primary)"
												: "var(--color-surface-card)",
										color:
											difficultyFilter === option
												? "white"
												: "var(--color-text-secondary)",
										borderColor: "var(--color-border)",
									}}
								>
									{difficultyLabel(option)}
								</button>
							))}
						</div>
					) : null}
					{showEffectFilters && effectOptions.length > 1 ? (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{effectOptions.map((option) => (
								<button
									key={`effect-${option}`}
									type="button"
									onClick={() => setEffectFilter(option)}
									className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
									style={{
										backgroundColor:
											effectFilter === option
												? "var(--color-secondary)"
												: "var(--color-surface-card)",
										color:
											effectFilter === option
												? "white"
												: "var(--color-text-secondary)",
										borderColor: "var(--color-border)",
									}}
								>
									{effectLabel(option)}
								</button>
							))}
						</div>
					) : null}
					{(difficultyFilter !== "all" || effectFilter !== "all") && (
						<button
							type="button"
							onClick={() => {
								setDifficultyFilter("all");
								setEffectFilter("all");
							}}
							aria-label={clearFiltersLabel}
							title={clearFiltersLabel}
							className="self-start w-8 h-8 rounded-full border flex items-center justify-center"
							style={{
								backgroundColor: "var(--color-surface-card)",
								color: "var(--color-text-secondary)",
								borderColor: "var(--color-border)",
							}}
						>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="px-4 flex-1">
				<AnimatePresence mode="wait">
					{isLoading ? (
						<div key="loading" className="flex flex-col gap-4">
							{["s1", "s2", "s3"].map((k) => (
								<SkeletonCard key={k} />
							))}
						</div>
					) : filteredItems.length === 0 ? (
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<EmptyState
								illustration={
									<img
										src={svgDataUri(`
											<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
												<rect width="120" height="120" rx="28" fill="#E8F4D0"/>
												<circle cx="52" cy="52" r="22" stroke="#5DB87F" stroke-width="8"/>
												<path d="M68 68L86 86" stroke="#5DB87F" stroke-width="8" stroke-linecap="round"/>
											</svg>
									`)}
										alt=""
										className="w-20 h-20"
									/>
								}
								title={emptyTitle}
								description={
									normalizedQuery.length >= 2 ? noResultsHint : emptyHint
								}
							/>
						</motion.div>
					) : (
						<motion.div
							key="content"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col gap-4"
						>
							{filteredItems.map((item, i) => (
								<RetroCard
									key={item._id || i}
									item={item}
									type={item.__kind || tab}
									index={i}
									isDark={isDark}
									typeLabel={cardTypeLabel(item.__kind || tab)}
									fallbackItemLabel={tr("library.card_default_item", "Item")}
									onClick={() => handleCardClick(item, item.__kind || tab)}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

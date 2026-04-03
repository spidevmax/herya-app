import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getBreathingPatterns } from "@/api/breathing.api";
import { getPoses } from "@/api/poses.api";
import { getSequences } from "@/api/sequences.api";
import { EmptyState, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const PALETTE = {
	beginner: {
		bg: "var(--color-tone-success-bg)",
		border: "var(--color-success)",
		statBg:
			"color-mix(in srgb, var(--color-success) 16%, var(--color-surface-card))",
	},
	intermediate: {
		bg: "var(--color-tone-warning-bg)",
		border: "var(--color-warning)",
		statBg:
			"color-mix(in srgb, var(--color-warning) 16%, var(--color-surface-card))",
	},
	advanced: {
		bg: "var(--color-tone-danger-bg)",
		border: "var(--color-danger)",
		statBg:
			"color-mix(in srgb, var(--color-danger) 16%, var(--color-surface-card))",
	},
	default: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-primary)",
		statBg:
			"color-mix(in srgb, var(--color-primary) 16%, var(--color-surface-card))",
	},
};

const BREATHING_PALETTE = {
	calming: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-info)",
		statBg:
			"color-mix(in srgb, var(--color-info) 16%, var(--color-surface-card))",
	},
	energizing: {
		bg: "var(--color-tone-warning-bg)",
		border: "var(--color-warning)",
		statBg:
			"color-mix(in srgb, var(--color-warning) 16%, var(--color-surface-card))",
	},
	balancing: {
		bg: "var(--color-tone-primary-bg)",
		border: "var(--color-primary)",
		statBg:
			"color-mix(in srgb, var(--color-primary) 16%, var(--color-surface-card))",
	},
	cooling: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-info)",
		statBg:
			"color-mix(in srgb, var(--color-info) 16%, var(--color-surface-card))",
	},
	heating: {
		bg: "var(--color-tone-danger-bg)",
		border: "var(--color-danger)",
		statBg:
			"color-mix(in srgb, var(--color-danger) 16%, var(--color-surface-card))",
	},
	default: {
		bg: "var(--color-tone-info-bg)",
		border: "var(--color-primary)",
		statBg:
			"color-mix(in srgb, var(--color-primary) 16%, var(--color-surface-card))",
	},
};

const INTENSITY_DIFFICULTY_ORDER = {
	gentle: ["beginner", "intermediate", "advanced"],
	moderate: ["intermediate", "beginner", "advanced"],
	vigorous: ["advanced", "intermediate", "beginner"],
};

const TIME_EFFECT_ORDER = {
	morning: ["energizing", "balancing", "calming", "cooling", "heating"],
	afternoon: ["balancing", "energizing", "calming", "cooling", "heating"],
	evening: ["calming", "balancing", "cooling", "energizing", "heating"],
	anytime: ["balancing", "calming", "energizing", "cooling", "heating"],
};

const getPalette = (item, type) => {
	if (type === "breathing") {
		return BREATHING_PALETTE[item.energyEffect] ?? BREATHING_PALETTE.default;
	}

	return PALETTE[item.difficulty] ?? PALETTE.default;
};

const getPreferredOrderIndex = (value, order, fallbackIndex = 99) => {
	if (!value) return fallbackIndex;
	const index = order.indexOf(String(value));
	return index === -1 ? fallbackIndex : index;
};

const collectSearchText = (item) =>
	[
		item.englishName,
		item.name,
		item.sanskritName,
		item.romanizationName,
		item.romanizedName,
		item.description,
		item.family,
		item.energyEffect,
		item.difficulty,
		item.level,
	]
		.filter(Boolean)
		.join(" ");

const getMonogram = (title) =>
	String(title || "")
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

const getSequencePoseCount = (item) => {
	if (Array.isArray(item.keyPoses)) return item.keyPoses.length;
	if (Array.isArray(item.structure?.corePoses))
		return item.structure.corePoses.length;
	return null;
};

const getTypeLabel = (type, t) => {
	if (type === "sequences")
		return t("library.card_type_sequence", "VK Sequence");
	if (type === "poses") return t("library.card_type_pose", "Asana");
	if (type === "breathing")
		return t("library.card_type_breathing", "Pranayama");
	return t("library.card_type_default", "Library");
};

const getCardTitle = (item, fallbackItemLabel) =>
	item.englishName || item.name || item.romanizationName || fallbackItemLabel;

const getCardSubtitle = (item) =>
	item.romanizationName || item.sanskritName || item.romanizedName || "";

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
				className="text-[9px] font-black uppercase tracking-[0.12em] mt-0.5"
				style={{ color }}
			>
				{label}
			</span>
		</div>
	);
}

function RetroCard({
	item,
	type,
	index,
	onClick,
	typeLabel,
	fallbackItemLabel,
}) {
	const palette = getPalette(item, type);
	const borderColor = palette.border;
	const title = getCardTitle(item, fallbackItemLabel);
	const subtitle = getCardSubtitle(item);
	const monogram = getMonogram(title) || typeLabel.slice(0, 2).toUpperCase();
	const imageSrc = item.image;
	const stats =
		type === "sequences"
			? [
					{ value: item.level ?? "—", label: "LEVEL" },
					{
						value: item.family
							? String(item.family).replace(/_/g, " ").toUpperCase()
							: "—",
						label: "FAMILY",
					},
					{ value: getSequencePoseCount(item) ?? "—", label: "POSES" },
				]
			: type === "poses"
				? [
						{ value: item.difficulty ?? "—", label: "LEVEL" },
						{ value: item.poseType ?? item.category ?? "—", label: "TYPE" },
					]
				: [
						{ value: item.energyEffect ?? "—", label: "EFFECT" },
						{ value: item.breathType ?? item.category ?? "—", label: "TYPE" },
					];

	return (
		<motion.button
			type="button"
			onClick={onClick}
			whileHover={{ y: -3, scale: 1.01 }}
			whileTap={{ scale: 0.985 }}
			className="relative w-full text-left rounded-[28px] overflow-hidden transition-shadow duration-200"
			style={{ boxShadow: "0 14px 0 rgba(0,0,0,0.08)" }}
		>
			<div
				className="overflow-hidden rounded-[28px] border-4"
				style={{ backgroundColor: palette.bg, borderColor }}
			>
				<div className="flex items-stretch">
					<div
						className="flex items-center justify-center flex-shrink-0"
						style={{
							width: 88,
							minHeight: 88,
							backgroundColor: `${borderColor}18`,
							borderRight: `3px solid ${borderColor}`,
						}}
					>
						{imageSrc ? (
							<img
								src={imageSrc}
								alt={title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div
								className="w-full h-full flex items-center justify-center text-2xl font-black"
								style={{
									color: borderColor,
									fontFamily: '"Fredoka", sans-serif',
								}}
							>
								{monogram || "?"}
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-0.5">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p
									className="text-[10px] font-black uppercase tracking-[0.12em]"
									style={{ color: borderColor }}
								>
									{typeLabel}
								</p>
								<h3
									className="font-black text-base leading-tight truncate"
									style={{
										color: borderColor,
										fontFamily: '"Fredoka", sans-serif',
									}}
								>
									{title}
								</h3>
							</div>
							<span
								className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
								style={{
									color: borderColor,
									backgroundColor: `${borderColor}16`,
								}}
							>
								#{index + 1}
							</span>
						</div>
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
								className="text-xs leading-snug mt-1 line-clamp-2"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{item.description}
							</p>
						)}
					</div>
				</div>

				<div
					className="flex items-center justify-between px-3 py-2 gap-2"
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: `${borderColor}11`,
					}}
				>
					<div className="flex gap-1.5 flex-wrap">
						{stats.map((stat) => (
							<StatBox
								key={stat.label}
								value={stat.value}
								label={stat.label}
								bg={palette.statBg}
								color={borderColor}
							/>
						))}
					</div>
				</div>
			</div>
		</motion.button>
	);
}

const getCardType = (item, fallbackType) => item.__kind || fallbackType;

const filterByQuery = (item, query) => {
	if (query.length < 2) return true;
	return collectSearchText(item).toLowerCase().includes(query);
};

const filterByDifficulty = (item, difficultyFilter) =>
	difficultyFilter === "all" ? true : item.difficulty === difficultyFilter;

const filterByEffect = (item, effectFilter) =>
	effectFilter === "all" ? true : item.energyEffect === effectFilter;

const sortItems = (items, type, difficultyOrder, effectOrder) =>
	[...items].sort((a, b) => {
		const aDifficultyRank =
			type === "sequences" || type === "poses"
				? getPreferredOrderIndex(a.difficulty, difficultyOrder)
				: 99;
		const bDifficultyRank =
			type === "sequences" || type === "poses"
				? getPreferredOrderIndex(b.difficulty, difficultyOrder)
				: 99;
		if (aDifficultyRank !== bDifficultyRank)
			return aDifficultyRank - bDifficultyRank;

		const aEffectRank =
			type === "breathing"
				? getPreferredOrderIndex(a.energyEffect, effectOrder)
				: 99;
		const bEffectRank =
			type === "breathing"
				? getPreferredOrderIndex(b.energyEffect, effectOrder)
				: 99;
		if (aEffectRank !== bEffectRank) return aEffectRank - bEffectRank;

		const aTitle = getCardTitle(a, "").toLowerCase();
		const bTitle = getCardTitle(b, "").toLowerCase();
		return aTitle.localeCompare(bTitle);
	});

export default function Library() {
	const navigate = useNavigate();
	const { user } = useAuth();
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
	const [error, setError] = useState(false);
	const [hasFetched, setHasFetched] = useState(false);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [difficultyFilter, setDifficultyFilter] = useState("all");
	const [effectFilter, setEffectFilter] = useState("all");

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedQuery(query.trim().toLowerCase());
		}, 220);

		return () => window.clearTimeout(timeoutId);
	}, [query]);

	useEffect(() => {
		if (!tab) return;
		setQuery("");
		setDifficultyFilter("all");
		setEffectFilter("all");
	}, [tab]);

	useEffect(() => {
		if (hasFetched) return;
		setLoading(true);
		setError(false);

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
					seqPayload.sequences ?? (Array.isArray(seqPayload) ? seqPayload : []);
				const poseList =
					posePayload.poses ?? (Array.isArray(posePayload) ? posePayload : []);
				const breathList =
					breathPayload.patterns ??
					(Array.isArray(breathPayload) ? breathPayload : []);

				setSequences(Array.isArray(seqList) ? seqList : []);
				setPoses(Array.isArray(poseList) ? poseList : []);
				setBreathing(Array.isArray(breathList) ? breathList : []);
				setHasFetched(true);
			})
			.catch(() => {
				setSequences([]);
				setPoses([]);
				setBreathing([]);
				setError(true);
			})
			.finally(() => setLoading(false));
	}, [hasFetched]);

	const allTabLabel = tr("library.tabs_all", "All");
	const tabs = [
		{ key: "all", label: allTabLabel },
		{ key: "sequences", label: t("library.tabs_sequences", "Sequences") },
		{ key: "poses", label: t("library.tabs_poses", "Poses") },
		{ key: "breathing", label: t("library.tabs_breathing", "Breathing") },
	];

	const cardTypeLabel = (type) => getTypeLabel(type, t);

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
	const preferredIntensity = user?.preferences?.practiceIntensity || "moderate";
	const preferredTimeOfDay = user?.preferences?.timeOfDay || "anytime";
	const difficultyOrder =
		INTENSITY_DIFFICULTY_ORDER[preferredIntensity] ||
		INTENSITY_DIFFICULTY_ORDER.moderate;
	const effectOrder =
		TIME_EFFECT_ORDER[preferredTimeOfDay] || TIME_EFFECT_ORDER.anytime;

	const filteredItems = items.filter(
		(item) =>
			filterByQuery(item, debouncedQuery) &&
			filterByDifficulty(item, difficultyFilter) &&
			filterByEffect(item, effectFilter),
	);
	const prioritizedItems = sortItems(
		filteredItems,
		tab,
		difficultyOrder,
		effectOrder,
	);
	const groupedItems =
		tab === "all"
			? ["sequences", "poses", "breathing"].map((groupType) => {
					const groupItems = prioritizedItems.filter(
						(item) => getCardType(item, tab) === groupType,
					);
					return {
						type: groupType,
						label: cardTypeLabel(groupType),
						count: groupItems.length,
						items: groupItems,
					};
				})
			: [];

	const handleCardClick = (item, type) => {
		if (type === "sequences") navigate(`/library/sequence/${item._id}`);
		else if (type === "poses") navigate(`/library/pose/${item._id}`);
		else if (type === "breathing") navigate(`/library/breathing/${item._id}`);
	};

	const emptyTitle =
		tab === "sequences"
			? t("library.empty_sequences", "No sequences yet")
			: tab === "poses"
				? t("library.empty_poses", "No poses yet")
				: t("library.empty_patterns", "No patterns yet");
	const emptyHint =
		tab === "sequences"
			? t("library.empty_sequences_hint", "Try another filter or search term.")
			: tab === "poses"
				? t("library.empty_poses_hint", "Try another filter or search term.")
				: t(
						"library.empty_patterns_hint",
						"Try another filter or search term.",
					);
	const noResultsHint = tr("library.no_results", "No results found");
	const clearFiltersLabel = tr("library.clear_filters", "Clear filters");
	const errorTitle = tr("library.error_title", "Could not load content");
	const errorHint = tr(
		"library.error_hint",
		"Check your connection and try again.",
	);
	const retryLabel = tr("library.retry", "Retry");
	const resultCount = prioritizedItems.length;
	const resultCountLabel = tr("library.result_count", "{n} items");

	return (
		<div className="flex flex-col pt-4 pb-6 gap-4">
			<div className="px-4">
				<h1
					className="text-3xl font-bold mb-1"
					style={{
						color: "var(--color-text-primary)",
						fontFamily: '"Fredoka", sans-serif',
					}}
				>
					{t("library.title", "Library")}
				</h1>
				<p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
					{tr(
						"library.subtitle",
						"Explore and study sequences, poses, and pranayama.",
					)}
				</p>
			</div>

			<div
				className="flex gap-2 px-4 overflow-x-auto pb-1"
				role="tablist"
				aria-label={t("library.title", "Library")}
			>
				{tabs.map((tabItem) => (
					<button
						key={tabItem.key}
						type="button"
						role="tab"
						aria-selected={tab === tabItem.key}
						onClick={() => setTab(tabItem.key)}
						className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border-2"
						style={{
							backgroundColor:
								tab === tabItem.key
									? "var(--color-secondary)"
									: "var(--color-surface-card)",
							color:
								tab === tabItem.key ? "white" : "var(--color-text-secondary)",
							borderColor:
								tab === tabItem.key
									? "var(--color-secondary)"
									: "var(--color-border)",
							fontFamily: '"DM Sans", sans-serif',
						}}
					>
						{tabItem.label}
					</button>
				))}
			</div>

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
						placeholder={t("library.search", "Search the library")}
						className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm font-medium focus:outline-none transition border-2"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border)",
							color: "var(--color-text-primary)",
							fontFamily: '"DM Sans", sans-serif',
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
									aria-pressed={difficultyFilter === option}
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
									{option === "all"
										? tr("library.filters_all_difficulties", "All difficulties")
										: option.charAt(0).toUpperCase() + option.slice(1)}
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
									aria-pressed={effectFilter === option}
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
									{option === "all"
										? tr("library.filters_all_effects", "All effects")
										: option.charAt(0).toUpperCase() + option.slice(1)}
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
							className="self-start h-8 rounded-full border flex items-center justify-center gap-1.5 px-3 text-xs font-semibold"
							style={{
								backgroundColor: "var(--color-surface-card)",
								color: "var(--color-text-secondary)",
								borderColor: "var(--color-border)",
							}}
						>
							<X size={14} />
							{clearFiltersLabel}
						</button>
					)}
				</div>
			</div>

			{!loading && !error && resultCount > 0 && (
				<div className="px-4">
					<p
						className="text-xs font-medium"
						style={{ color: "var(--color-text-muted)" }}
					>
						{resultCountLabel.replace("{n}", String(resultCount))}
					</p>
				</div>
			)}

			<div className="px-4 flex-1" role="tabpanel">
				<AnimatePresence mode="wait">
					{loading ? (
						<div key="loading" className="flex flex-col gap-4">
							{["s1", "s2", "s3"].map((key) => (
								<SkeletonCard key={key} />
							))}
						</div>
					) : error ? (
						<motion.div
							key="error"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<EmptyState
								title={errorTitle}
								description={errorHint}
								action={
									<button
										type="button"
										onClick={() => {
											setError(false);
											setHasFetched(false);
										}}
										className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
										style={{ backgroundColor: "var(--color-primary)" }}
									>
										{retryLabel}
									</button>
								}
							/>
						</motion.div>
					) : prioritizedItems.length === 0 ? (
						<motion.div
							key="empty"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
						>
							<EmptyState
								title={emptyTitle}
								description={
									debouncedQuery.length >= 2 ? noResultsHint : emptyHint
								}
							/>
						</motion.div>
					) : (
						<motion.div
							key="content"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col gap-6"
						>
							{tab === "all" ? (
								groupedItems.map((group) =>
									group.count > 0 ? (
										<div key={group.type} className="flex flex-col gap-3">
											<div className="flex items-center justify-between px-1">
												<h2
													className="text-sm font-bold uppercase tracking-widest"
													style={{ color: "var(--color-text-secondary)" }}
												>
													{group.label}
												</h2>
												<span
													className="text-xs font-medium"
													style={{ color: "var(--color-text-muted)" }}
												>
													{group.count}
												</span>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{group.items.map((item, itemIndex) => (
													<RetroCard
														key={
															item._id ||
															item.id ||
															item.slug ||
															item.englishName ||
															item.name ||
															item.title
														}
														item={item}
														type={getCardType(item, tab)}
														index={itemIndex}
														typeLabel={cardTypeLabel(getCardType(item, tab))}
														fallbackItemLabel={tr(
															"library.card_default_item",
															"Item",
														)}
														onClick={() =>
															handleCardClick(item, getCardType(item, tab))
														}
													/>
												))}
											</div>
										</div>
									) : null,
								)
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{prioritizedItems.map((item, itemIndex) => (
										<RetroCard
											key={
												item._id ||
												item.id ||
												item.slug ||
												item.englishName ||
												item.name ||
												item.title
											}
											item={item}
											type={getCardType(item, tab)}
											index={itemIndex}
											typeLabel={cardTypeLabel(getCardType(item, tab))}
											fallbackItemLabel={tr(
												"library.card_default_item",
												"Item",
											)}
											onClick={() =>
												handleCardClick(item, getCardType(item, tab))
											}
										/>
									))}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

import {
	useDeferredValue,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
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

const ALL_TAB_PREVIEW_LIMIT = 6;

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

const getCardType = (item, fallbackType) => item.__kind || fallbackType;

const getItemId = (item) =>
	item._id ||
	item.id ||
	item.slug ||
	item.englishName ||
	item.name ||
	item.title;

const filterByQuery = (item, query) => {
	if (query.length < 2) return true;
	return collectSearchText(item).toLowerCase().includes(query);
};

const filterByDifficulty = (item, difficultyFilter, type) => {
	if (difficultyFilter === "all") return true;
	if (type !== "sequences" && type !== "poses") return true;
	return item.difficulty === difficultyFilter;
};

const filterByEffect = (item, effectFilter, type) => {
	if (effectFilter === "all") return true;
	if (type !== "breathing") return true;
	return item.energyEffect === effectFilter;
};

const sortItems = (items, fallbackType, difficultyOrder, effectOrder) =>
	[...items].sort((a, b) => {
		const aType = getCardType(a, fallbackType);
		const bType = getCardType(b, fallbackType);
		const aDifficultyRank =
			aType === "sequences" || aType === "poses"
				? getPreferredOrderIndex(a.difficulty, difficultyOrder)
				: 99;
		const bDifficultyRank =
			bType === "sequences" || bType === "poses"
				? getPreferredOrderIndex(b.difficulty, difficultyOrder)
				: 99;
		if (aDifficultyRank !== bDifficultyRank)
			return aDifficultyRank - bDifficultyRank;

		const aEffectRank =
			aType === "breathing"
				? getPreferredOrderIndex(a.energyEffect, effectOrder)
				: 99;
		const bEffectRank =
			bType === "breathing"
				? getPreferredOrderIndex(b.energyEffect, effectOrder)
				: 99;
		if (aEffectRank !== bEffectRank) return aEffectRank - bEffectRank;

		const aTitle = getCardTitle(a, "").toLowerCase();
		const bTitle = getCardTitle(b, "").toLowerCase();
		return aTitle.localeCompare(bTitle);
	});

const StatBox = ({ value, label, bg, color }) => {
	return (
		<div
			className="flex min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1.5"
			style={{ backgroundColor: bg }}
		>
			<span
				className="font-display text-sm font-bold leading-none"
				style={{ color }}
			>
				{value}
			</span>
			<span
				className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
				style={{ color }}
			>
				{label}
			</span>
		</div>
	);
};

const RetroCard = ({ item, type, onClick, typeLabel, fallbackItemLabel }) => {
	const palette = getPalette(item, type);
	const borderColor = palette.border;
	const title = getCardTitle(item, fallbackItemLabel);
	const subtitle = getCardSubtitle(item);
	const monogram = getMonogram(title) || typeLabel.slice(0, 2).toUpperCase();
	const imageSrc =
		item.image || item.media?.thumbnail?.url || item.media?.images?.[0]?.url;
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
			className="relative w-full overflow-hidden rounded-[28px] text-left transition-shadow duration-200"
			style={{ boxShadow: "0 14px 0 rgba(0,0,0,0.08)" }}
		>
			<div
				className="overflow-hidden rounded-[28px] border-4"
				style={{ backgroundColor: palette.bg, borderColor }}
			>
				<div className="flex items-stretch">
					<div
						className="flex shrink-0 items-center justify-center"
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
								className="h-full w-full object-cover"
							/>
						) : (
							<div
								className="font-display flex h-full w-full items-center justify-center text-2xl font-black"
								style={{ color: borderColor }}
							>
								{monogram || "?"}
							</div>
						)}
					</div>

					<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p
									className="text-[10px] font-black uppercase tracking-[0.12em]"
									style={{ color: borderColor }}
								>
									{typeLabel}
								</p>
								<h3
									className="truncate text-base font-black leading-tight"
									style={{ color: borderColor }}
								>
									{title}
								</h3>
							</div>
						</div>
						{subtitle && subtitle !== title && (
							<p
								className="truncate text-xs font-medium italic"
								style={{ color: `${borderColor}bb` }}
							>
								{subtitle}
							</p>
						)}
						{item.description && (
							<p
								className="mt-1 line-clamp-2 text-xs leading-snug"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{item.description}
							</p>
						)}
					</div>
				</div>

				<div
					className="flex items-center justify-between gap-2 px-3 py-2"
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: `${borderColor}11`,
					}}
				>
					<div className="flex flex-wrap gap-1.5">
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
};

const Library = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { t } = useLanguage();
	const tabsId = useId();
	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
	};

	const [tab, setTab] = useState("all");
	const [sequences, setSequences] = useState([]);
	const [poses, setPoses] = useState([]);
	const [breathing, setBreathing] = useState([]);
	const [loading, setLoading] = useState(false);
	const [failedTypes, setFailedTypes] = useState([]);
	const [hasFetched, setHasFetched] = useState(false);
	const [query, setQuery] = useState("");
	const [difficultyFilter, setDifficultyFilter] = useState("all");
	const [effectFilter, setEffectFilter] = useState("all");
	const deferredQuery = useDeferredValue(query.trim().toLowerCase());

	const tabs = [
		{ key: "all", label: tr("library.tabs_all", "All") },
		{ key: "sequences", label: t("library.tabs_sequences", "Sequences") },
		{ key: "poses", label: t("library.tabs_poses", "Poses") },
		{ key: "breathing", label: t("library.tabs_breathing", "Breathing") },
	];

	const cardTypeLabel = (type) => getTypeLabel(type, t);

	const handleTabChange = (nextTab) => {
		setTab(nextTab);
		if (nextTab === "all") {
			setDifficultyFilter("all");
			setEffectFilter("all");
		}
		if (nextTab === "breathing") setDifficultyFilter("all");
		if (nextTab === "sequences" || nextTab === "poses") setEffectFilter("all");
	};

	const handleTabKeyDown = (event, index) => {
		if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
		event.preventDefault();
		const nextIndex =
			event.key === "ArrowRight"
				? (index + 1) % tabs.length
				: (index - 1 + tabs.length) % tabs.length;
		handleTabChange(tabs[nextIndex].key);
	};

	useEffect(() => {
		if (hasFetched) return;
		setLoading(true);
		setFailedTypes([]);

		Promise.allSettled([
			getSequences({ limit: 100 }),
			getPoses({ limit: 100 }),
			getBreathingPatterns({ limit: 100 }),
		])
			.then(([seqRes, poseRes, breathRes]) => {
				const nextFailedTypes = [];

				if (seqRes.status === "fulfilled") {
					const seqPayload = seqRes.value.data?.data || seqRes.value.data || {};
					const seqList =
						seqPayload.sequences ?? (Array.isArray(seqPayload) ? seqPayload : []);
					setSequences(Array.isArray(seqList) ? seqList : []);
				} else {
					setSequences([]);
					nextFailedTypes.push("sequences");
				}

				if (poseRes.status === "fulfilled") {
					const posePayload = poseRes.value.data?.data || poseRes.value.data || {};
					const poseList =
						posePayload.poses ?? (Array.isArray(posePayload) ? posePayload : []);
					setPoses(Array.isArray(poseList) ? poseList : []);
				} else {
					setPoses([]);
					nextFailedTypes.push("poses");
				}

				if (breathRes.status === "fulfilled") {
					const breathPayload =
						breathRes.value.data?.data || breathRes.value.data || {};
					const breathList =
						breathPayload.patterns ??
						(Array.isArray(breathPayload) ? breathPayload : []);
					setBreathing(Array.isArray(breathList) ? breathList : []);
				} else {
					setBreathing([]);
					nextFailedTypes.push("breathing");
				}

				setFailedTypes(nextFailedTypes);
				setHasFetched(true);
			})
			.finally(() => setLoading(false));
	}, [hasFetched]);

	const items = useMemo(
		() =>
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
							],
		[tab, sequences, poses, breathing],
	);

	const difficultyOptions = useMemo(
		() => [
			"all",
			...Array.from(
				new Set(
					items
						.filter((item) => {
							const itemType = getCardType(item, tab);
							return itemType === "sequences" || itemType === "poses";
						})
						.map((item) => item.difficulty)
						.filter((value) => typeof value === "string" && value.length > 0),
				),
			),
		],
		[items, tab],
	);

	const effectOptions = useMemo(
		() => [
			"all",
			...Array.from(
				new Set(
					items
						.filter((item) => getCardType(item, tab) === "breathing")
						.map((item) => item.energyEffect)
						.filter((value) => typeof value === "string" && value.length > 0),
				),
			),
		],
		[items, tab],
	);

	const showDifficultyFilters = tab === "sequences" || tab === "poses";
	const showEffectFilters = tab === "breathing";
	const preferredIntensity = user?.preferences?.practiceIntensity || "moderate";
	const preferredTimeOfDay = user?.preferences?.timeOfDay || "anytime";
	const difficultyOrder =
		INTENSITY_DIFFICULTY_ORDER[preferredIntensity] ||
		INTENSITY_DIFFICULTY_ORDER.moderate;
	const effectOrder =
		TIME_EFFECT_ORDER[preferredTimeOfDay] || TIME_EFFECT_ORDER.anytime;

	const filteredItems = useMemo(
		() =>
			items.filter((item) => {
				const itemType = getCardType(item, tab);
				return (
					filterByQuery(item, deferredQuery) &&
					filterByDifficulty(item, difficultyFilter, itemType) &&
					filterByEffect(item, effectFilter, itemType)
				);
			}),
		[items, tab, deferredQuery, difficultyFilter, effectFilter],
	);

	const prioritizedItems = useMemo(
		() => sortItems(filteredItems, tab, difficultyOrder, effectOrder),
		[filteredItems, tab, difficultyOrder, effectOrder],
	);

	const groupedItems = useMemo(
		() =>
			tab === "all"
				? ["sequences", "poses", "breathing"].map((groupType) => {
						const groupItems = prioritizedItems.filter(
							(item) => getCardType(item, tab) === groupType,
						);
						return {
							type: groupType,
							label: getTypeLabel(groupType, t),
							count: groupItems.length,
							items: groupItems.slice(0, ALL_TAB_PREVIEW_LIMIT),
						};
					})
				: [],
		[prioritizedItems, tab, t],
	);

	const handleCardClick = (item, type) => {
		const itemId = getItemId(item);
		if (!itemId) return;
		if (type === "sequences") navigate(`/library/sequence/${itemId}`);
		else if (type === "poses") navigate(`/library/pose/${itemId}`);
		else if (type === "breathing") navigate(`/library/breathing/${itemId}`);
	};

	const emptyTitle =
		tab === "all"
			? tr("library.title", "Library")
			: tab === "sequences"
				? t("library.empty_sequences", "No sequences yet")
				: tab === "poses"
					? t("library.empty_poses", "No poses yet")
					: t("library.empty_patterns", "No patterns yet");
	const emptyHint =
		tab === "all"
			? tr(
					"library.subtitle",
					"Explore and study sequences, poses, and pranayama.",
				)
			: tab === "sequences"
				? t("library.empty_sequences_hint", "Try another filter or search term.")
				: tab === "poses"
					? t("library.empty_poses_hint", "Try another filter or search term.")
					: t(
							"library.empty_patterns_hint",
							"Try another filter or search term.",
						);
	const noResultsHint = tr("library.no_results", "No results found");
	const clearFiltersLabel = tr("library.clear_filters", "Clear filters");
	const hasFatalError = failedTypes.length === 3;
	const failedTypeLabels = failedTypes.map((type) => cardTypeLabel(type)).join(", ");
	const warningTitle = tr("library.error_title", "Could not load content");
	const warningHint =
		failedTypes.length > 0
			? `${tr("library.error_hint", "Check your connection and try again.")} ${failedTypeLabels}.`
			: "";
	const retryLabel = tr("library.retry", "Retry");
	const resultCount = prioritizedItems.length;
	const resultCountLabel = tr("library.result_count", "{n} items");
	const searchLabel = tr("library.search", "Search the library");
	const searchHelpText =
		query.trim().length === 1 ? "Type at least 2 characters to search." : "";

	return (
		<div className="flex flex-col gap-4 pt-4 pb-6">
			<div className="px-4">
				<h1 className="mb-1 text-3xl font-bold text-[var(--color-text-primary)]">
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
				className="flex gap-2 overflow-x-auto px-4 pb-1"
				role="tablist"
				aria-label={t("library.title", "Library")}
			>
				{tabs.map((tabItem, index) => (
					<button
						key={tabItem.key}
						type="button"
						role="tab"
						id={`${tabsId}-${tabItem.key}-tab`}
						aria-controls={`${tabsId}-${tabItem.key}-panel`}
						aria-selected={tab === tabItem.key}
						tabIndex={tab === tabItem.key ? 0 : -1}
						onClick={() => handleTabChange(tabItem.key)}
						onKeyDown={(event) => handleTabKeyDown(event, index)}
						className="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all"
						style={{
							backgroundColor:
								tab === tabItem.key
									? "var(--color-info)"
									: "var(--color-surface-card)",
							color:
								tab === tabItem.key ? "white" : "var(--color-text-secondary)",
							borderColor:
								tab === tabItem.key
									? "var(--color-info)"
									: "var(--color-border)",
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
						className="absolute top-1/2 left-4 -translate-y-1/2"
						aria-hidden="true"
						style={{ color: "var(--color-text-muted)" }}
					/>
					<label htmlFor={`${tabsId}-search`} className="sr-only">
						{searchLabel}
					</label>
					<input
						id={`${tabsId}-search`}
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={searchLabel}
						aria-describedby={searchHelpText ? `${tabsId}-search-help` : undefined}
						className="w-full rounded-2xl border-2 py-2.5 pr-11 pl-11 text-sm font-medium transition focus:outline-none"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border)",
							color: "var(--color-text-primary)",
						}}
					/>
					{query ? (
						<button
							type="button"
							onClick={() => setQuery("")}
							aria-label="Clear search"
							className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
							style={{ color: "var(--color-text-muted)" }}
						>
							<X size={16} aria-hidden="true" />
						</button>
					) : null}
				</div>

				{searchHelpText ? (
					<p
						id={`${tabsId}-search-help`}
						className="mt-2 text-xs"
						style={{ color: "var(--color-text-muted)" }}
					>
						{searchHelpText}
					</p>
				) : null}

				<div className="mt-3 flex flex-col gap-2">
					{showDifficultyFilters ? (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{difficultyOptions.map((option) => (
								<button
									key={`difficulty-${option}`}
									type="button"
									aria-pressed={difficultyFilter === option}
									onClick={() => setDifficultyFilter(option)}
									className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
									style={{
										backgroundColor:
											difficultyFilter === option
												? "var(--color-warning)"
												: "var(--color-surface-card)",
										color:
											difficultyFilter === option
												? "white"
												: "var(--color-text-secondary)",
										borderColor:
											difficultyFilter === option
												? "var(--color-warning)"
												: "var(--color-border)",
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
									className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold"
									style={{
										backgroundColor:
											effectFilter === option
												? "var(--color-success)"
												: "var(--color-surface-card)",
										color:
											effectFilter === option
												? "white"
												: "var(--color-text-secondary)",
										borderColor:
											effectFilter === option
												? "var(--color-success)"
												: "var(--color-border)",
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
							className="flex h-8 items-center justify-center gap-1.5 self-start rounded-full border px-3 text-xs font-semibold"
							style={{
								backgroundColor: "var(--color-surface-card)",
								color: "var(--color-text-secondary)",
								borderColor: "var(--color-border)",
							}}
						>
							<X size={14} aria-hidden="true" />
							{clearFiltersLabel}
						</button>
					)}
				</div>
			</div>

			{!loading && failedTypes.length > 0 && (
				<div className="px-4">
					<div
						className="rounded-2xl border px-4 py-3 text-sm"
						style={{
							backgroundColor: "var(--color-warning-bg)",
							color: "var(--color-warning-text)",
							borderColor: "var(--color-warning-border)",
						}}
					>
						<p className="font-semibold">{warningTitle}</p>
						<p className="mt-1">{warningHint}</p>
					</div>
				</div>
			)}

			{!loading && !hasFatalError && resultCount > 0 && (
				<div className="px-4">
					<p
						className="text-xs font-medium"
						style={{ color: "var(--color-text-muted)" }}
					>
						{resultCountLabel.replace("{n}", String(resultCount))}
					</p>
				</div>
			)}

			<div
				className="flex-1 px-4"
				role="tabpanel"
				id={`${tabsId}-${tab}-panel`}
				aria-labelledby={`${tabsId}-${tab}-tab`}
			>
				<AnimatePresence mode="wait">
					{loading ? (
						<div key="loading" className="flex flex-col gap-4">
							{["s1", "s2", "s3"].map((key) => (
								<SkeletonCard key={key} />
							))}
						</div>
					) : hasFatalError ? (
						<motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
							<EmptyState
								title={warningTitle}
								description={tr(
									"library.error_hint",
									"Check your connection and try again.",
								)}
								action={
									<button
										type="button"
										onClick={() => {
											setFailedTypes([]);
											setHasFetched(false);
										}}
										className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
										style={{ backgroundColor: "var(--color-info)" }}
									>
										{retryLabel}
									</button>
								}
							/>
						</motion.div>
					) : prioritizedItems.length === 0 ? (
						<motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
							<EmptyState
								title={emptyTitle}
								description={deferredQuery.length >= 2 ? noResultsHint : emptyHint}
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
											<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
												{group.items.map((item) => (
													<RetroCard
														key={getItemId(item)}
														item={item}
														type={getCardType(item, tab)}
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
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
									{prioritizedItems.map((item) => (
										<RetroCard
											key={getItemId(item)}
											item={item}
											type={getCardType(item, tab)}
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
};

export default Library;

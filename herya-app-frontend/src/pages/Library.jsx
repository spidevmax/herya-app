import {
	useDeferredValue,
	useEffect,
	useId,
	useMemo,
	useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBreathingPatterns } from "@/api/breathing.api";
import { getPoses } from "@/api/poses.api";
import { getSequences } from "@/api/sequences.api";
import { EmptyState, SkeletonCard } from "@/components/ui";
import RetroCard from "@/components/library/RetroCard";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
	translateWithFallback,
	getCardType,
	getItemId,
	getTypeLabel,
	filterByQuery,
	filterByDifficulty,
	filterByEffect,
	sortItems,
	INTENSITY_DIFFICULTY_ORDER,
	TIME_EFFECT_ORDER,
} from "@/utils/libraryHelpers";

const ALL_TAB_PREVIEW_LIMIT = 6;
const VALID_TABS = ["all", "sequences", "poses", "breathing"];

const Library = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { t } = useLanguage();
	const tabsId = useId();
	const tr = (key, fallback) => translateWithFallback(t, key, fallback);

	// ── URL-synced state ────────────────────────────────────────────────────
	const [searchParams, setSearchParams] = useSearchParams();
	const initialTab = VALID_TABS.includes(searchParams.get("tab"))
		? searchParams.get("tab")
		: "all";
	const initialQuery = searchParams.get("q") || "";
	const initialDifficulty = searchParams.get("difficulty") || "all";
	const initialEffect = searchParams.get("effect") || "all";

	const [tab, setTab] = useState(initialTab);
	const [query, setQuery] = useState(initialQuery);
	const [difficultyFilter, setDifficultyFilter] = useState(initialDifficulty);
	const [effectFilter, setEffectFilter] = useState(initialEffect);

	// ── Data state ──────────────────────────────────────────────────────────
	const [sequences, setSequences] = useState([]);
	const [poses, setPoses] = useState([]);
	const [breathing, setBreathing] = useState([]);
	const [loading, setLoading] = useState(false);
	const [failedTypes, setFailedTypes] = useState([]);
	const [hasFetched, setHasFetched] = useState(false);

	const deferredQuery = useDeferredValue(query.trim().toLowerCase());

	// ── Sync state → URL (debounced via deferred query) ─────────────────────
	useEffect(() => {
		const params = new URLSearchParams();
		if (tab !== "all") params.set("tab", tab);
		if (query.trim()) params.set("q", query.trim());
		if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
		if (effectFilter !== "all") params.set("effect", effectFilter);
		setSearchParams(params, { replace: true });
	}, [tab, query, difficultyFilter, effectFilter, setSearchParams]);

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

	// ── Fetch data (tag __kind once at fetch time) ──────────────────────────
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
					setSequences(
						(Array.isArray(seqList) ? seqList : []).map((s) => ({
							...s,
							__kind: "sequences",
						})),
					);
				} else {
					setSequences([]);
					nextFailedTypes.push("sequences");
				}

				if (poseRes.status === "fulfilled") {
					const posePayload =
						poseRes.value.data?.data || poseRes.value.data || {};
					const poseList =
						posePayload.poses ?? (Array.isArray(posePayload) ? posePayload : []);
					setPoses(
						(Array.isArray(poseList) ? poseList : []).map((p) => ({
							...p,
							__kind: "poses",
						})),
					);
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
					setBreathing(
						(Array.isArray(breathList) ? breathList : []).map((b) => ({
							...b,
							__kind: "breathing",
						})),
					);
				} else {
					setBreathing([]);
					nextFailedTypes.push("breathing");
				}

				setFailedTypes(nextFailedTypes);
				setHasFetched(true);
			})
			.finally(() => setLoading(false));
	}, [hasFetched]);

	// ── Derived data (no re-spreading since __kind is already tagged) ───────
	const items = useMemo(
		() =>
			tab === "sequences"
				? sequences
				: tab === "poses"
					? poses
					: tab === "breathing"
						? breathing
						: [...sequences, ...poses, ...breathing],
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

	// ── Translated strings ──────────────────────────────────────────────────
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
		query.trim().length === 1
			? tr("library.search_min_chars", "Type at least 2 characters to search.")
			: "";
	const seeAllLabel = tr("dashboard.see_all", "See all");

	// ── Translate filter option label ───────────────────────────────────────
	const translateDifficulty = (option) =>
		option === "all"
			? tr("library.filters_all_difficulties", "All difficulties")
			: tr(`library.${option}`, option.charAt(0).toUpperCase() + option.slice(1));

	const translateEffect = (option) =>
		option === "all"
			? tr("library.filters_all_effects", "All effects")
			: tr(
					`library.effects.${option}`,
					option.charAt(0).toUpperCase() + option.slice(1),
				);

	return (
		<main className="flex flex-col gap-4 pt-4 pb-6">
			<header className="px-4">
				<h1 className="font-display mb-1 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
					{t("library.title", "Library")}
				</h1>
				<p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
					{tr(
						"library.subtitle",
						"Explore and study sequences, poses, and pranayama.",
					)}
				</p>
			</header>

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
							aria-label={tr("library.clear_search", "Clear search")}
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
							{difficultyOptions.map((option) => {
								const label = translateDifficulty(option);
								return (
									<button
										key={`difficulty-${option}`}
										type="button"
										aria-pressed={difficultyFilter === option}
										aria-label={`${tr("library.filter_difficulty", "Difficulty")}: ${label}`}
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
										{label}
									</button>
								);
							})}
						</div>
					) : null}

					{showEffectFilters && effectOptions.length > 1 ? (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{effectOptions.map((option) => {
								const label = translateEffect(option);
								return (
									<button
										key={`effect-${option}`}
										type="button"
										aria-pressed={effectFilter === option}
										aria-label={`${tr("library.filter_technique", "Technique")}: ${label}`}
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
										{label}
									</button>
								);
							})}
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

			{/* Partial failure warning with retry */}
			{!loading && failedTypes.length > 0 && (
				<div className="px-4">
					<div
						className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
						role="alert"
						style={{
							backgroundColor: "var(--color-warning-bg)",
							color: "var(--color-warning-text)",
							borderColor: "var(--color-warning-border)",
						}}
					>
						<div>
							<p className="font-semibold">{warningTitle}</p>
							<p className="mt-1">{warningHint}</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setFailedTypes([]);
								setHasFetched(false);
							}}
							className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
							style={{ backgroundColor: "var(--color-warning)" }}
						>
							{retryLabel}
						</button>
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

			<section
				className="flex-1 px-4"
				role="tabpanel"
				id={`${tabsId}-${tab}-panel`}
				aria-labelledby={`${tabsId}-${tab}-tab`}
			>
				<AnimatePresence mode="wait">
					{loading ? (
						<div key="loading" className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
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
										<section
											key={group.type}
											aria-labelledby={`${tabsId}-${group.type}-heading`}
											className="flex flex-col gap-3"
										>
											<header className="flex items-center justify-between px-1">
												<h2
													id={`${tabsId}-${group.type}-heading`}
													className="font-display text-sm font-bold uppercase tracking-widest"
													style={{ color: "var(--color-text-secondary)" }}
												>
													{group.label}
												</h2>
												<div className="flex items-center gap-2">
													<span
														className="text-xs font-medium"
														style={{ color: "var(--color-text-muted)" }}
													>
														{group.count}
													</span>
													{group.count > ALL_TAB_PREVIEW_LIMIT && (
														<button
															type="button"
															onClick={() => handleTabChange(group.type)}
															className="text-xs font-semibold"
															style={{ color: "var(--color-primary)" }}
														>
															{seeAllLabel}
														</button>
													)}
												</div>
											</header>
											<ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 list-none m-0 p-0">
												{group.items.map((item) => (
													<li key={getItemId(item)} className="h-full">
														<RetroCard
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
													</li>
												))}
											</ul>
										</section>
									) : null,
								)
							) : (
								<ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 list-none m-0 p-0">
									{prioritizedItems.map((item) => (
										<li key={getItemId(item)} className="h-full">
											<RetroCard
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
										</li>
									))}
								</ul>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</section>
		</main>
	);
};

export default Library;

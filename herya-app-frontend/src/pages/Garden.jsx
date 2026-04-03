import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { getJournalEntries } from "@/api/journalEntries.api";
import FlowerGarden from "@/components/garden/FlowerGarden";
import { EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "@/utils/helpers";
import { MOOD_COLORS } from "@/utils/constants";

const VIEW_MODE = {
	GRAPH: "graph",
	FLOWERS: "flowers",
};

const ALL_MOODS = "all";
const ALL_TYPES = "all";
const DATE_PRESETS = [7, 30, 90];

const PRACTICE_TYPE_LABELS = {
	vk_sequence: "Vinyasa Krama",
	pranayama: "Pranayama",
	meditation: "Meditacion",
	complete_practice: "Practica completa",
};

const resolveEntryId = (entry) =>
	entry?._id || entry?.id || entry?.session || null;

const getEntryTimestamp = (entry) => {
	const raw = entry?.date || entry?.createdAt;
	if (!raw) return null;
	const ts = new Date(raw).getTime();
	return Number.isNaN(ts) ? null : ts;
};

const getPracticeType = (entry) =>
	entry?.session?.sessionType || entry?.sessionType || null;

const getPrimaryMood = (entry) => {
	const moods = entry.moodAfter || entry.moodBefore || [];
	return moods[0] || "calm";
};

const toUniqueMoodTokens = (moods, prefix) => {
	const seen = {};
	return moods.map((mood) => {
		seen[mood] = (seen[mood] ?? 0) + 1;
		return {
			mood,
			key: `${prefix}-${mood}-${seen[mood]}`,
		};
	});
};

const buildGraphData = (entries) => {
	const chronological = [...entries].sort(
		(a, b) =>
			new Date(a.date || a.createdAt || 0).getTime() -
			new Date(b.date || b.createdAt || 0).getTime(),
	);

	const total = chronological.length;
	const nodes = chronological.map((entry, idx) => {
		const id = resolveEntryId(entry);
		const mood = getPrimaryMood(entry);
		const color = MOOD_COLORS[mood] || "#5DB075";
		const radius = 150 + (idx % 3) * 52;
		const angle = (Math.PI * 2 * idx) / Math.max(total, 1);
		const x = 500 + Math.cos(angle) * radius;
		const y = 260 + Math.sin(angle) * (radius * 0.56);

		return { id, entry, mood, color, x, y };
	});

	const sequenceEdges = nodes.slice(1).map((node, idx) => ({
		id: `seq-${nodes[idx].id}-${node.id}`,
		source: nodes[idx].id,
		target: node.id,
		type: "sequence",
	}));

	const byMood = nodes.reduce((acc, node) => {
		if (!acc[node.mood]) acc[node.mood] = [];
		acc[node.mood].push(node);
		return acc;
	}, {});

	const moodEdges = Object.values(byMood).flatMap((group) =>
		group.slice(1).map((node, idx) => ({
			id: `mood-${group[idx].id}-${node.id}`,
			source: group[idx].id,
			target: node.id,
			type: "mood",
		})),
	);

	return {
		nodes,
		edges: [...sequenceEdges, ...moodEdges],
	};
};

export default function Garden() {
	const { t } = useLanguage();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);
	const [viewMode, setViewMode] = useState(VIEW_MODE.GRAPH);
	const [selectedMood, setSelectedMood] = useState(ALL_MOODS);
	const [selectedType, setSelectedType] = useState(ALL_TYPES);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [activeDatePreset, setActiveDatePreset] = useState(null);
	const [searchText, setSearchText] = useState("");
	const [debouncedSearchText, setDebouncedSearchText] = useState("");

	const entriesWithId = useMemo(
		() => entries.filter((entry) => resolveEntryId(entry)),
		[entries],
	);

	const moodOptions = useMemo(() => {
		const set = new Set();
		entriesWithId.forEach((entry) => {
			(entry.moodAfter || entry.moodBefore || []).forEach((mood) => {
				if (mood) set.add(mood);
			});
		});
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [entriesWithId]);

	const practiceTypeOptions = useMemo(() => {
		const set = new Set();
		entriesWithId.forEach((entry) => {
			const type = getPracticeType(entry);
			if (type) set.add(type);
		});
		return Array.from(set);
	}, [entriesWithId]);

	const filteredEntries = useMemo(() => {
		const query = debouncedSearchText.trim().toLowerCase();
		const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
		const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

		return entriesWithId.filter((entry) => {
			const moods = entry.moodAfter || entry.moodBefore || [];
			const moodOk = selectedMood === ALL_MOODS || moods.includes(selectedMood);

			const type = getPracticeType(entry);
			const typeOk = selectedType === ALL_TYPES || type === selectedType;

			const ts = getEntryTimestamp(entry);
			const fromOk = fromTs === null || (ts !== null && ts >= fromTs);
			const toOk = toTs === null || (ts !== null && ts <= toTs);

			const searchableText = `${entry.reflection || ""} ${entry.insights || ""}`
				.toLowerCase()
				.trim();
			const textOk = query.length === 0 || searchableText.includes(query);

			return moodOk && typeOk && fromOk && toOk && textOk;
		});
	}, [
		dateFrom,
		dateTo,
		debouncedSearchText,
		entriesWithId,
		selectedMood,
		selectedType,
	]);

	const graph = useMemo(
		() => buildGraphData(filteredEntries),
		[filteredEntries],
	);
	const nodeMap = useMemo(
		() => Object.fromEntries(graph.nodes.map((node) => [node.id, node])),
		[graph.nodes],
	);
	const selectedMoodTokens = useMemo(
		() =>
			selected
				? toUniqueMoodTokens(
						selected.moodAfter || selected.moodBefore || [],
						`${resolveEntryId(selected)}-mood`,
					)
				: [],
		[selected],
	);

	useEffect(() => {
		getJournalEntries({ limit: 50 })
			.then((r) => {
				// Backend returns { journals, pagination }
				const payload = r.data?.data || r.data || {};
				const list =
					payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries(list);
			})
			.catch(() => setEntries([]))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchText(searchText);
		}, 250);

		return () => clearTimeout(timer);
	}, [searchText]);

	const clearFilters = () => {
		setSelectedMood(ALL_MOODS);
		setSelectedType(ALL_TYPES);
		setDateFrom("");
		setDateTo("");
		setActiveDatePreset(null);
		setSearchText("");
		setDebouncedSearchText("");
	};

	const applyDatePreset = (days) => {
		const today = new Date();
		const from = new Date(today);
		from.setDate(today.getDate() - (days - 1));

		setDateFrom(from.toISOString().slice(0, 10));
		setDateTo(today.toISOString().slice(0, 10));
		setActiveDatePreset(days);
	};

	return (
		<div className="flex flex-col gap-6 pt-4 pb-6">
			<div className="flex items-center px-4">
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-primary)",
						}}
					>
						{t("garden.title")}
					</h1>
					<p
						className="text-sm"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{entriesWithId.length}{" "}
						{entriesWithId.length !== 1
							? t("garden.entries_plural")
							: t("garden.entries_singular")}
					</p>
				</div>
			</div>

			<div className="px-4">
				<div
					className="inline-flex rounded-2xl p-1"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<button
						type="button"
						onClick={() => setViewMode(VIEW_MODE.GRAPH)}
						className="px-4 py-2 text-xs font-bold rounded-xl transition"
						style={{
							backgroundColor:
								viewMode === VIEW_MODE.GRAPH
									? "var(--color-primary)"
									: "transparent",
							color:
								viewMode === VIEW_MODE.GRAPH
									? "white"
									: "var(--color-text-secondary)",
						}}
					>
						Graph
					</button>
					<button
						type="button"
						onClick={() => setViewMode(VIEW_MODE.FLOWERS)}
						className="px-4 py-2 text-xs font-bold rounded-xl transition"
						style={{
							backgroundColor:
								viewMode === VIEW_MODE.FLOWERS
									? "var(--color-secondary)"
									: "transparent",
							color:
								viewMode === VIEW_MODE.FLOWERS
									? "white"
									: "var(--color-text-secondary)",
						}}
					>
						Flowers
					</button>
				</div>
			</div>

			{loading ? (
				<div className="mx-4 rounded-3xl h-72 bg-[#E8E4DE] animate-pulse" />
			) : entriesWithId.length === 0 ? (
				<EmptyState
					icon={<BookOpen size={36} />}
					title={t("garden.empty_title")}
					description={t("garden.empty_hint")}
					className="mx-4"
				/>
			) : (
				<div className="px-4 flex flex-col gap-3">
					<div
						className="rounded-2xl p-3 flex flex-col gap-3"
						style={{
							backgroundColor: "var(--color-surface-card)",
							border: "1px solid var(--color-border-soft)",
						}}
					>
						<div className="flex items-center justify-between gap-2">
							<p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
								Filters
							</p>
							<button
								type="button"
								onClick={clearFilters}
								className="text-[11px] font-semibold"
								style={{ color: "var(--color-primary)" }}
							>
								Clear
							</button>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
							<input
								type="text"
								value={searchText}
								onChange={(event) => setSearchText(event.target.value)}
								placeholder="Search insights/reflection"
								className="h-10 rounded-xl px-3 text-sm outline-none sm:col-span-2 lg:col-span-4"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-soft)",
								}}
							/>

							<select
								value={selectedMood}
								onChange={(event) => setSelectedMood(event.target.value)}
								className="h-10 rounded-xl px-3 text-sm outline-none"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-soft)",
								}}
							>
								<option value={ALL_MOODS}>All moods</option>
								{moodOptions.map((mood) => (
									<option key={`mood-filter-${mood}`} value={mood}>
										{mood}
									</option>
								))}
							</select>

							<select
								value={selectedType}
								onChange={(event) => setSelectedType(event.target.value)}
								className="h-10 rounded-xl px-3 text-sm outline-none"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-soft)",
								}}
							>
								<option value={ALL_TYPES}>All types</option>
								{practiceTypeOptions.map((type) => (
									<option key={`type-filter-${type}`} value={type}>
										{PRACTICE_TYPE_LABELS[type] || type}
									</option>
								))}
							</select>

							<input
								type="date"
								value={dateFrom}
								onChange={(event) => {
									setDateFrom(event.target.value);
									setActiveDatePreset(null);
								}}
								max={dateTo || undefined}
								className="h-10 rounded-xl px-3 text-sm outline-none"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-soft)",
								}}
							/>

							<input
								type="date"
								value={dateTo}
								onChange={(event) => {
									setDateTo(event.target.value);
									setActiveDatePreset(null);
								}}
								min={dateFrom || undefined}
								className="h-10 rounded-xl px-3 text-sm outline-none"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-soft)",
								}}
							/>
						</div>

						<div className="flex flex-wrap gap-2">
							{DATE_PRESETS.map((days) => (
								<button
									type="button"
									key={`preset-${days}`}
									onClick={() => applyDatePreset(days)}
									className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
									style={{
										backgroundColor:
											activeDatePreset === days
												? "var(--color-primary)"
												: "var(--color-surface)",
										color:
											activeDatePreset === days
												? "white"
												: "var(--color-text-secondary)",
										border: "1px solid var(--color-border-soft)",
									}}
								>
									{days}d
								</button>
							))}
						</div>

						<p className="text-xs text-[var(--color-text-secondary)]">
							Showing {filteredEntries.length} of {entriesWithId.length} entries
						</p>
					</div>

					{filteredEntries.length === 0 ? (
						<EmptyState
							icon={<BookOpen size={28} />}
							title="No matches for these filters"
							description="Try removing mood/type filters or expanding dates."
						/>
					) : viewMode === VIEW_MODE.FLOWERS ? (
						<>
							<FlowerGarden
								entries={filteredEntries}
								onFlowerClick={setSelected}
							/>
							<p className="text-center text-[#9CA3AF] text-xs mt-3">
								{t("garden.tap_hint")}
							</p>
						</>
					) : (
						<div
							className="rounded-3xl p-4 sm:p-6"
							style={{
								background:
									"radial-gradient(circle at 20% 20%, #f3f9f5 0%, #f8f7f4 50%, #edf4f0 100%)",
								border: "1px solid var(--color-border-soft)",
							}}
						>
							<div className="relative h-[460px] w-full overflow-hidden rounded-2xl bg-white/60">
								<svg viewBox="0 0 1000 520" className="h-full w-full">
									<title>Garden Graph</title>
									{graph.edges.map((edge) => {
										const source = nodeMap[edge.source];
										const target = nodeMap[edge.target];
										if (!source || !target) return null;
										return (
											<line
												key={edge.id}
												x1={source.x}
												y1={source.y}
												x2={target.x}
												y2={target.y}
												stroke={edge.type === "mood" ? "#5DB075" : "#B6C5D1"}
												strokeWidth={edge.type === "mood" ? 1.8 : 1.2}
												strokeOpacity={edge.type === "mood" ? 0.45 : 0.3}
											/>
										);
									})}

									{graph.nodes.map((node) => (
										<g key={node.id}>
											<circle
												cx={node.x}
												cy={node.y}
												r={17}
												fill={node.color}
												fillOpacity={0.16}
												stroke={node.color}
												strokeWidth={2.2}
											/>
											<circle cx={node.x} cy={node.y} r={7} fill={node.color} />
										</g>
									))}
								</svg>

								{graph.nodes.map((node) => {
									const created = format.date(
										node.entry.date || node.entry.createdAt,
									);
									return (
										<button
											type="button"
											key={`graph-btn-${node.id}`}
											onClick={() => setSelected(node.entry)}
											title={`${created} • ${node.mood}`}
											aria-label={`Open journal entry from ${created}`}
											className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full"
											style={{
												left: `${(node.x / 1000) * 100}%`,
												top: `${(node.y / 520) * 100}%`,
												boxShadow: `0 0 0 1px ${node.color}40 inset`,
											}}
										/>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}

			<AnimatePresence>
				{selected && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/30 z-40"
							onClick={() => setSelected(null)}
						/>
						<motion.div
							initial={{ y: "100%", opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: "100%", opacity: 0 }}
							transition={{ type: "spring", damping: 28, stiffness: 300 }}
							className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl p-6 z-50"
						>
							<div className="flex items-center justify-between mb-4">
								<div>
									<p className="font-display font-semibold text-[#1A1A2E]">
										{format.date(selected.date || selected.createdAt)}
									</p>
									<div className="flex gap-1 mt-1">
										{selectedMoodTokens.map(({ mood, key }) => (
											<span
												key={key}
												className="text-xs px-2 py-0.5 rounded-full"
												style={{
													backgroundColor:
														(MOOD_COLORS[mood] || "#5DB075") + "20",
													color: MOOD_COLORS[mood] || "#5DB075",
												}}
											>
												{mood}
											</span>
										))}
									</div>
								</div>
								<button
									type="button"
									onClick={() => setSelected(null)}
									className="w-9 h-9 rounded-full bg-[#F8F7F4] flex items-center justify-center"
								>
									<X size={18} className="text-[#6B7280]" />
								</button>
							</div>
							{selected.reflection && (
								<p className="text-[#6B7280] text-sm leading-relaxed bg-[#F8F7F4] rounded-2xl p-4">
									{selected.reflection}
								</p>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

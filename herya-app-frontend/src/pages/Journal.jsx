import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getJournalEntries } from "@/api/journalEntries.api";
import { Button, EmptyState, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { MOOD_COLORS } from "@/utils/constants";
import { format } from "@/utils/helpers";

const MOOD_EMOJIS_MAP = { 1: "😔", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

const VIEW_MODES = {
	TIMELINE: "timeline",
	GARDEN: "garden",
};

const ALL_MOODS = "all";
const ALL_TYPES = "all";

const resolveEntryId = (entry) =>
	entry?._id || entry?.id || entry?.session || null;

const hashString = (value) => {
	const text = String(value || "");
	let hash = 0;
	for (let i = 0; i < text.length; i += 1) {
		hash = (hash << 5) - hash + text.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

const formatEntryDate = (entry) => format.date(entry.date || entry.createdAt);

const getEntryTimestamp = (entry) => {
	const raw = entry?.date || entry?.createdAt;
	if (!raw) return null;
	const ts = new Date(raw).getTime();
	return Number.isNaN(ts) ? null : ts;
};

const getPracticeType = (entry) =>
	entry?.session?.sessionType || entry?.sessionType || null;

const PRACTICE_TYPE_LABELS = {
	vk_sequence: "Vinyasa Krama",
	pranayama: "Pranayama",
	meditation: "Meditacion",
	complete_practice: "Practica completa",
};

const getPrimaryMood = (entry) => {
	const moods = entry.moodAfter || entry.moodBefore || [];
	return moods[0] || "calm";
};

const getReflectionBlocks = (entry) => {
	const blocks = [
		{ id: "reflection", text: entry.reflection },
		{ id: "emotionalNotes", text: entry.emotionalNotes },
		{ id: "insights", text: entry.insights },
		{ id: "gratitude", text: entry.gratitude },
		{ id: "physicalSensations", text: entry.physicalSensations },
	];
	return blocks.filter(
		(block) => block.text && String(block.text).trim().length > 0,
	);
};

const buildGardenData = (entries) => {
	const chronological = [...entries]
		.filter((entry) => resolveEntryId(entry))
		.sort(
			(a, b) =>
				new Date(a.date || a.createdAt || 0).getTime() -
				new Date(b.date || b.createdAt || 0).getTime(),
		);

	const total = chronological.length;
	const nodes = chronological.map((entry, idx) => {
		const id = resolveEntryId(entry);
		const mood = getPrimaryMood(entry);
		const hue = MOOD_COLORS[mood] || "#5DB075";
		const ring = hashString(id) % 3;
		const radius = 140 + ring * 60 + Math.min(total, 12) * 2;
		const angle = (Math.PI * 2 * idx) / Math.max(total, 1);
		const jitter = (hashString(`${id}-jitter`) % 24) - 12;
		const x = 500 + Math.cos(angle) * (radius + jitter);
		const y = 260 + Math.sin(angle) * (radius * 0.55 + jitter);

		return {
			id,
			entry,
			x,
			y,
			mood,
			color: hue,
		};
	});

	const sequentialEdges = nodes.slice(1).map((node, idx) => {
		const prev = nodes[idx];
		return {
			id: `seq-${prev.id}-${node.id}`,
			source: prev.id,
			target: node.id,
			type: "sequence",
		};
	});

	const byMood = nodes.reduce((acc, node) => {
		if (!acc[node.mood]) acc[node.mood] = [];
		acc[node.mood].push(node);
		return acc;
	}, {});

	const moodEdges = Object.values(byMood).flatMap((moodNodes) =>
		moodNodes.slice(1).map((node, idx) => ({
			id: `mood-${moodNodes[idx].id}-${node.id}`,
			source: moodNodes[idx].id,
			target: node.id,
			type: "mood",
		})),
	);

	return {
		nodes,
		edges: [...sequentialEdges, ...moodEdges],
	};
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

function JournalCard({ entry, index, onClick }) {
	const { t } = useLanguage();
	const moodVal = entry.moodBefore ?? entry.energyBefore;
	const moods = entry.moodAfter || entry.moodBefore || [];
	const moodTokens = toUniqueMoodTokens(moods.slice(0, 3), "journal-mood");
	const reflectionBlocks = getReflectionBlocks(entry);
	const entryId = resolveEntryId(entry);
	const energyAfter = entry.energyLevel?.after ?? null;
	const stressAfter = entry.stressLevel?.after ?? null;
	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.04, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] rounded-2xl p-4 flex items-start gap-3 shadow-[var(--shadow-soft)] w-full text-left"
		>
			<div className="w-11 h-11 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center text-2xl flex-shrink-0">
				{MOOD_EMOJIS_MAP[moodVal] ?? "🌱"}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between mb-1">
					<p className="text-xs text-[var(--color-text-muted)]">
						{formatEntryDate(entry)}
					</p>
					<ChevronRight size={14} className="text-[var(--color-text-muted)]" />
				</div>
				{moods.length > 0 && (
					<div className="flex gap-1 mb-1.5 flex-wrap">
						{moodTokens.map(({ mood, key }) => {
							const moodColor = MOOD_COLORS[mood] ?? "var(--color-info)";
							return (
								<span
									key={key}
									className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
									style={{
										backgroundColor: `color-mix(in srgb, ${moodColor} 20%, transparent)`,
										color: moodColor,
									}}
								>
									{mood}
								</span>
							);
						})}
					</div>
				)}
				{(energyAfter || stressAfter) && (
					<div className="flex gap-3 mb-2 text-[10px] font-semibold uppercase tracking-wider">
						{energyAfter && (
							<span style={{ color: "var(--color-secondary)" }}>
								Energy {energyAfter}/10
							</span>
						)}
						{stressAfter && (
							<span style={{ color: "var(--color-accent)" }}>
								Stress {stressAfter}/10
							</span>
						)}
					</div>
				)}
				{reflectionBlocks.length > 0 ? (
					<div className="flex flex-col gap-1.5">
						{reflectionBlocks.map((block) => (
							<p
								key={`${entryId}-${block.id}`}
								className="text-[var(--color-text-secondary)] text-xs leading-relaxed"
							>
								{block.text}
							</p>
						))}
					</div>
				) : (
					<p className="text-[var(--color-text-muted)] text-xs italic">
						{t("journal.no_reflection")}
					</p>
				)}
			</div>
		</motion.button>
	);
}

function JournalGardenGraph({ entries, onEntryClick }) {
	const graph = useMemo(() => buildGardenData(entries), [entries]);
	const nodeMap = useMemo(
		() => Object.fromEntries(graph.nodes.map((node) => [node.id, node])),
		[graph.nodes],
	);

	if (!graph.nodes.length) return null;

	return (
		<div
			className="rounded-3xl p-4 sm:p-6"
			style={{
				background:
					"radial-gradient(circle at 20% 20%, #f3f9f5 0%, #f8f7f4 50%, #edf4f0 100%)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<div className="mb-3 flex items-center justify-between">
				<p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
					Digital Garden Graph
				</p>
				<p className="text-xs text-[var(--color-text-secondary)]">
					{graph.nodes.length} notes
				</p>
			</div>

			<div className="relative h-[460px] w-full overflow-hidden rounded-2xl bg-white/60">
				<svg viewBox="0 0 1000 520" className="h-full w-full">
					<title>Digital Garden Graph</title>
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
					const created = formatEntryDate(node.entry);
					return (
						<button
							type="button"
							key={`btn-${node.id}`}
							onClick={() => onEntryClick(node.entry)}
							title={`${created} • ${node.mood}`}
							aria-label={`Open journal note from ${created}`}
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
	);
}

export default function Journal() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState(VIEW_MODES.TIMELINE);
	const [selectedMood, setSelectedMood] = useState(ALL_MOODS);
	const [selectedType, setSelectedType] = useState(ALL_TYPES);
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
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

	const filteredGraphEntries = useMemo(() => {
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

			return moodOk && typeOk && fromOk && toOk;
		});
	}, [dateFrom, dateTo, entriesWithId, selectedMood, selectedType]);

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

	const entryCount = entriesWithId.length;
	const entryLabel =
		entryCount !== 1
			? t("journal.entries_plural")
			: t("journal.entries_singular");

	const clearGardenFilters = () => {
		setSelectedMood(ALL_MOODS);
		setSelectedType(ALL_TYPES);
		setDateFrom("");
		setDateTo("");
	};

	return (
		<div className="flex flex-col pt-4 pb-6">
			<div className="flex items-center justify-between px-4 mb-5">
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						{t("journal.title")}
					</h1>
					<p className="text-[var(--color-text-muted)] text-sm">
						{entryCount} {entryLabel}
					</p>
				</div>
				<button
					type="button"
					onClick={() => navigate("/journal/new")}
					className="w-11 h-11 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-brand)]"
				>
					<Plus size={22} className="text-white" />
				</button>
			</div>

			<div className="px-4 mb-4">
				<div
					className="inline-flex rounded-2xl p-1"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<button
						type="button"
						onClick={() => setViewMode(VIEW_MODES.TIMELINE)}
						className="px-4 py-2 text-xs font-bold rounded-xl transition"
						style={{
							backgroundColor:
								viewMode === VIEW_MODES.TIMELINE
									? "var(--color-primary)"
									: "transparent",
							color:
								viewMode === VIEW_MODES.TIMELINE
									? "white"
									: "var(--color-text-secondary)",
						}}
					>
						Timeline
					</button>
					<button
						type="button"
						onClick={() => setViewMode(VIEW_MODES.GARDEN)}
						className="px-4 py-2 text-xs font-bold rounded-xl transition"
						style={{
							backgroundColor:
								viewMode === VIEW_MODES.GARDEN
									? "var(--color-secondary)"
									: "transparent",
							color:
								viewMode === VIEW_MODES.GARDEN
									? "white"
									: "var(--color-text-secondary)",
						}}
					>
						Garden Graph
					</button>
				</div>
			</div>

			<div className="px-4 flex flex-col gap-3">
				{loading ? (
					["j1", "j2", "j3"].map((k) => <SkeletonCard key={k} />)
				) : entriesWithId.length === 0 ? (
					<EmptyState
						illustration="📔"
						title={t("journal.empty_title")}
						description={t("journal.empty_hint")}
						action={
							<Button
								onClick={() => navigate("/journal/new")}
								variant="primary"
							>
								{t("journal.empty_action")}
							</Button>
						}
					/>
				) : viewMode === VIEW_MODES.GARDEN ? (
					<>
						<div
							className="rounded-2xl p-3 flex flex-col gap-3"
							style={{
								backgroundColor: "var(--color-surface-card)",
								border: "1px solid var(--color-border-soft)",
							}}
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
									Graph filters
								</p>
								<button
									type="button"
									onClick={clearGardenFilters}
									className="text-[11px] font-semibold"
									style={{ color: "var(--color-primary)" }}
								>
									Clear
								</button>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
										<option key={`mood-option-${mood}`} value={mood}>
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
										<option key={`type-option-${type}`} value={type}>
											{PRACTICE_TYPE_LABELS[type] || type}
										</option>
									))}
								</select>

								<input
									type="date"
									value={dateFrom}
									onChange={(event) => setDateFrom(event.target.value)}
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
									onChange={(event) => setDateTo(event.target.value)}
									min={dateFrom || undefined}
									className="h-10 rounded-xl px-3 text-sm outline-none"
									style={{
										backgroundColor: "var(--color-surface)",
										color: "var(--color-text-primary)",
										border: "1px solid var(--color-border-soft)",
									}}
								/>
							</div>

							<p className="text-xs text-[var(--color-text-secondary)]">
								Showing {filteredGraphEntries.length} of {entriesWithId.length}{" "}
								notes
							</p>
						</div>

						{filteredGraphEntries.length > 0 ? (
							<JournalGardenGraph
								entries={filteredGraphEntries}
								onEntryClick={(entry) =>
									navigate(`/journal/${resolveEntryId(entry)}/edit`)
								}
							/>
						) : (
							<EmptyState
								illustration="🌿"
								title="No matches for these filters"
								description="Try a wider date range or remove mood/type filters."
								action={
									<Button onClick={clearGardenFilters} variant="secondary">
										Reset filters
									</Button>
								}
							/>
						)}
					</>
				) : (
					entriesWithId.map((e, i) => (
						<JournalCard
							key={resolveEntryId(e)}
							entry={e}
							index={i}
							onClick={() => navigate(`/journal/${resolveEntryId(e)}/edit`)}
						/>
					))
				)}
			</div>
		</div>
	);
}

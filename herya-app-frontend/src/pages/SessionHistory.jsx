import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSessions } from "@/api/sessions.api";
import { FilterChips, SkeletonCard, EmptyState } from "@/components/ui";
import { format } from "@/utils/helpers";
import { VK_FAMILIES } from "@/utils/constants";

const TYPE_OPTIONS = [
	{ key: "", label: "Todas", color: "var(--color-primary)" },
	{ key: "vk_sequence", label: "Secuencia VK", color: "var(--color-primary)" },
	{ key: "pranayama", label: "Pranayama", color: "var(--color-primary)" },
	{ key: "meditation", label: "Meditación", color: "var(--color-info)" },
	{
		key: "complete_practice",
		label: "Práctica completa",
		color: "var(--color-warning)",
	},
];

const TYPE_CONFIG = {
	vk_sequence: {
		emoji: "🧘",
		color: "var(--color-primary)",
		label: "Secuencia VK",
	},
	pranayama: { emoji: "💨", color: "var(--color-primary)", label: "Pranayama" },
	meditation: { emoji: "🌿", color: "var(--color-info)", label: "Meditación" },
	complete_practice: {
		emoji: "⭐",
		color: "var(--color-warning)",
		label: "Práctica completa",
	},
};

function SessionCard({ session, index, onClick }) {
	const cfg = TYPE_CONFIG[session.sessionType] ?? {
		emoji: "🧘",
		color: "var(--color-primary)",
		label: session.sessionType,
	};
	const family = session.vkFamily
		? VK_FAMILIES.find((f) => f.key === session.vkFamily)
		: null;
	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.04, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] rounded-2xl p-4 flex items-center gap-4 shadow-[var(--shadow-soft)] w-full text-left"
		>
			<div
				className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
				style={{ backgroundColor: `${cfg.color}15` }}
			>
				{family?.emoji ?? cfg.emoji}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
					{cfg.label}
				</p>
				<p className="text-[var(--color-text-muted)] text-xs mt-0.5">
					{format.date(session.date || session.createdAt)}
				</p>
				{session.duration && (
					<p className="text-[var(--color-text-secondary)] text-xs">
						{format.duration(session.duration)}
					</p>
				)}
			</div>
			<div className="flex items-center gap-2 flex-shrink-0">
				{session.completed && (
					<span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
				)}
				<ChevronRight size={16} className="text-[var(--color-text-muted)]" />
			</div>
		</motion.button>
	);
}

export default function SessionHistory() {
	const navigate = useNavigate();
	const [sessions, setSessions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [type, setType] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const PAGE_SIZE = 15;

	const fetchSessions = useCallback(() => {
		setLoading(true);
		getSessions({ sessionType: type || undefined, limit: PAGE_SIZE, page })
			.then((r) => {
				const data = r.data?.data || r.data || {};
				const list = Array.isArray(data)
					? data
					: (data.sessions ?? data.items ?? []);
				setSessions(list);
				setHasMore((data.pagination?.total ?? list.length) > page * PAGE_SIZE);
			})
			.catch(() => setSessions([]))
			.finally(() => setLoading(false));
	}, [type, page]);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	return (
		<div className="flex flex-col pt-4 pb-6 min-h-0">
			<div className="px-4 mb-4">
				<div className="flex items-center gap-3 mb-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center shadow-sm"
					>
						<ChevronLeft
							size={20}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						Historial
					</h1>
				</div>
				<FilterChips
					options={TYPE_OPTIONS}
					selected={type}
					onSelect={(nextType) => {
						setType(nextType);
						setPage(1);
					}}
				/>
			</div>

			<div className="px-4 flex flex-col gap-3">
				{loading ? (
					["s1", "s2", "s3", "s4"].map((k) => <SkeletonCard key={k} />)
				) : sessions.length === 0 ? (
					<EmptyState
						illustration="📋"
						title="Sin sesiones"
						description="Empieza tu primera práctica"
					/>
				) : (
					sessions.map((s, i) => (
						<SessionCard
							key={s._id}
							session={s}
							index={i}
							onClick={() => navigate(`/sessions/${s._id}`)}
						/>
					))
				)}

				{!loading && hasMore && (
					<button
						type="button"
						onClick={() => setPage((p) => p + 1)}
						className="w-full py-3 rounded-2xl border border-[var(--color-border-soft)] text-[var(--color-primary)] text-sm font-semibold mt-2"
					>
						Cargar más
					</button>
				)}
			</div>
		</div>
	);
}

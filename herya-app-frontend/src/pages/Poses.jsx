import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getPoses, searchPoses } from '@/api/poses.api';
import {
	SearchBar,
	FilterChips,
	SkeletonCard,
	EmptyState,
	Badge,
} from '@/components/ui';

const DIFFICULTY_OPTIONS = [
	{ key: "", label: "Todas", color: "var(--color-info)" },
	{ key: "beginner", label: "Principiante", color: "var(--color-success)" },
	{ key: "intermediate", label: "Intermedio", color: "var(--color-warning)" },
	{ key: "advanced", label: "Avanzado", color: "var(--color-danger)" },
];

const DIFF_COLORS = {
	beginner: "var(--color-success)",
	intermediate: "var(--color-warning)",
	advanced: "var(--color-danger)",
};
const DIFF_LABELS = {
	beginner: "Principiante",
	intermediate: "Intermedio",
	advanced: "Avanzado",
};

function PoseCard({ pose, index, onClick }) {
	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.03, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] border border-[var(--color-border-soft)] rounded-2xl p-4 flex items-center gap-4 shadow-[var(--shadow-card)] w-full text-left"
		>
			<div
				className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
				style={{
					background:
						"linear-gradient(135deg, color-mix(in srgb, var(--color-info) 14%, transparent), color-mix(in srgb, var(--color-success) 14%, transparent))",
				}}
			>
				{pose.image ? (
					<img
						src={pose.image}
						alt={pose.englishName}
						className="w-full h-full object-cover rounded-xl"
					/>
				) : (
					<span className="text-2xl">🧘</span>
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
					{pose.name}
				</p>
				<p className="text-[var(--color-text-muted)] text-xs italic truncate">
					{pose.romanizationName}
				</p>
				<div className="flex gap-1.5 mt-1.5 flex-wrap">
					{pose.difficulty && (
						<Badge
							color={DIFF_COLORS[pose.difficulty] ?? "var(--color-text-muted)"}
						>
							{DIFF_LABELS[pose.difficulty] ?? pose.difficulty}
						</Badge>
					)}
					{pose.vkCategory?.primary && (
						<Badge color="var(--color-info)">
							{pose.vkCategory.primary.replace(/_/g, " ")}
						</Badge>
					)}
				</div>
			</div>
		</motion.button>
	);
}

export default function Poses() {
	const navigate = useNavigate();
	const [poses, setPoses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [difficulty, setDifficulty] = useState("");
	const debounceRef = useRef(null);

	const fetchPoses = useCallback(() => {
		setLoading(true);
		getPoses({ difficulty: difficulty || undefined, limit: 60 })
			.then((r) => {
				// Backend returns { poses, pagination }
				const payload = r.data?.data || r.data || {};
				const list = payload.poses ?? (Array.isArray(payload) ? payload : []);
				setPoses(list);
			})
			.catch(() => setPoses([]))
			.finally(() => setLoading(false));
	}, [difficulty]);

	useEffect(() => {
		fetchPoses();
	}, [fetchPoses]);

	useEffect(() => {
		if (!query) {
			fetchPoses();
			return;
		}
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setLoading(true);
			searchPoses(query, { difficulty: difficulty || undefined, limit: 40 })
				.then((r) => {
					// searchPoses returns a direct array (no pagination wrapper)
					const payload = r.data?.data || r.data || [];
					setPoses(Array.isArray(payload) ? payload : (payload.poses ?? []));
				})
				.catch(() => setPoses([]))
				.finally(() => setLoading(false));
		}, 350);
		return () => clearTimeout(debounceRef.current);
	}, [query, difficulty, fetchPoses]);

	return (
		<div className="flex flex-col pt-4 pb-6 min-h-0">
			<div className="px-4 mb-4">
				<div className="flex items-center gap-3 mb-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-border-soft)] flex items-center justify-center shadow-sm"
					>
						<ChevronLeft
							size={20}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
						Posturas
					</h1>
				</div>
				<SearchBar
					value={query}
					onChange={setQuery}
					placeholder="Buscar postura…"
				/>
			</div>

			<div className="px-4 mb-4">
				<FilterChips
					options={DIFFICULTY_OPTIONS}
					selected={difficulty}
					onSelect={setDifficulty}
				/>
			</div>

			<div className="px-4 flex flex-col gap-3">
				{loading ? (
					["p1", "p2", "p3", "p4", "p5"].map((k) => <SkeletonCard key={k} />)
				) : poses.length === 0 ? (
					<EmptyState
						illustration="🧘"
						title="Sin posturas"
						description="Prueba con otros filtros o búsqueda"
					/>
				) : (
					poses.map((p, i) => (
						<PoseCard
							key={p._id}
							pose={p}
							index={i}
							onClick={() => navigate(`/poses/${p._id}`)}
						/>
					))
				)}
			</div>
		</div>
	);
}

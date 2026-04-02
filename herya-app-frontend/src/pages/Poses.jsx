import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getPoses, searchPoses } from "@/api/poses.api";
import {
	SearchBar,
	FilterChips,
	SkeletonCard,
	EmptyState,
	Badge,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const DIFF_COLORS = {
	beginner: "var(--color-success)",
	intermediate: "var(--color-warning)",
	advanced: "var(--color-danger)",
};

const normalizeList = (value) => {
	if (Array.isArray(value)) return value.filter(Boolean);
	if (typeof value === "string" && value.trim()) return [value.trim()];
	return [];
};

const formatValue = (value) => {
	if (value == null || value === "") return null;
	if (Array.isArray(value)) return value.filter(Boolean).join(", ");
	if (typeof value === "string") return value.replace(/_/g, " ");
	return String(value);
};

function PoseCard({ pose, index, onClick, t }) {
	const diffLabels = {
		beginner: t("library.beginner"),
		intermediate: t("library.intermediate"),
		advanced: t("library.advanced"),
	};
	const category = Array.isArray(pose.vkCategory?.primary)
		? pose.vkCategory.primary.join(", ")
		: typeof pose.vkCategory?.primary === "string"
			? pose.vkCategory.primary.replace(/_/g, " ")
			: null;
	const secondary = normalizeList(pose.vkCategory?.secondary)
		.slice(0, 2)
		.map((item) => item.replace(/_/g, " "));
	const family =
		typeof pose.family === "string" ? pose.family.replace(/_/g, " ") : null;
	const benefits = Array.isArray(pose.benefits)
		? pose.benefits.slice(0, 2)
		: typeof pose.benefits === "string"
			? [pose.benefits]
			: [];
	const targetMuscles = normalizeList(pose.targetMuscles).slice(0, 3);
	const jointFocus = normalizeList(pose.jointFocus).slice(0, 2);
	const breathingCue = pose.breathingCue
		? formatValue(pose.breathingCue)
		: null;
	const drishti = pose.drishti ? formatValue(pose.drishti) : null;
	const energyEffect = pose.energyEffect
		? formatValue(pose.energyEffect)
		: null;
	const sidedness = pose.sidedness?.type
		? formatValue(pose.sidedness.type)
		: null;
	const contraindications = normalizeList(pose.contraindications).slice(0, 2);
	const description = pose.description || "";

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.03, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] border border-[var(--color-border-soft)] rounded-2xl p-4 flex items-start gap-4 shadow-[var(--shadow-card)] w-full text-left"
		>
			<div
				className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5"
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
				<p className="font-semibold text-[var(--color-text-primary)] text-sm leading-snug">
					{pose.name}
				</p>
				<p className="text-[var(--color-text-muted)] text-xs italic mt-0.5">
					{pose.romanizationName}
				</p>
				<div className="flex gap-1.5 mt-2 flex-wrap">
					{pose.difficulty && (
						<Badge
							color={DIFF_COLORS[pose.difficulty] ?? "var(--color-text-muted)"}
						>
							{diffLabels[pose.difficulty] ?? pose.difficulty}
						</Badge>
					)}
					{category && <Badge color="var(--color-info)">{category}</Badge>}
					{family && <Badge color="var(--color-lavender)">{family}</Badge>}
				</div>
				<div className="mt-3 flex flex-col gap-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
					{breathingCue && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_breathe")}
							</span>{" "}
							{breathingCue}
						</p>
					)}
					{targetMuscles.length > 0 && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_muscles")}
							</span>{" "}
							{targetMuscles.join(", ")}
						</p>
					)}
					{jointFocus.length > 0 && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_joints")}
							</span>{" "}
							{jointFocus.join(", ")}
						</p>
					)}
					{drishti && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_drishti")}
							</span>{" "}
							{drishti}
						</p>
					)}
					{energyEffect && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_energy")}
							</span>{" "}
							{energyEffect}
						</p>
					)}
					{sidedness && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_side")}
							</span>{" "}
							{sidedness}
						</p>
					)}
					{secondary.length > 0 && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_type")}
							</span>{" "}
							{secondary.join(", ")}
						</p>
					)}
					{contraindications.length > 0 && (
						<p>
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("library.poses_cautions")}
							</span>{" "}
							{contraindications.join(" · ")}
						</p>
					)}
				</div>
				{description && (
					<p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
						{description}
					</p>
				)}
				{benefits.length > 0 && (
					<p className="mt-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
						{benefits.join(" · ")}
					</p>
				)}
			</div>
		</motion.button>
	);
}

export default function Poses() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [poses, setPoses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [difficulty, setDifficulty] = useState("");
	const debounceRef = useRef(null);

	const DIFFICULTY_OPTIONS = [
		{ key: "", label: t("library.poses_all_difficulties"), color: "var(--color-info)" },
		{ key: "beginner", label: t("library.beginner"), color: "var(--color-success)" },
		{ key: "intermediate", label: t("library.intermediate"), color: "var(--color-warning)" },
		{ key: "advanced", label: t("library.advanced"), color: "var(--color-danger)" },
	];

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
						{t("library.tabs_poses")}
					</h1>
				</div>
				<SearchBar
					value={query}
					onChange={setQuery}
					placeholder={t("library.search")}
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
						title={t("library.empty_poses")}
						description={t("library.empty_poses_hint")}
					/>
				) : (
					poses.map((p, i) => (
						<PoseCard
							key={p._id}
							pose={p}
							index={i}
							t={t}
							onClick={() => navigate(`/poses/${p._id}`)}
						/>
					))
				)}
			</div>
		</div>
	);
}

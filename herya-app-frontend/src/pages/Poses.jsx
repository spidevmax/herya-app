import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PersonStanding } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPoses, searchPoses } from "@/api/poses.api";
import {
	Badge,
	EmptyState,
	FilterChips,
	SearchBar,
	SkeletonCard,
} from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const DIFF_COLORS = {
	beginner: "var(--ink)",
	intermediate: "var(--surya)",
	advanced: "var(--alert)",
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

const PoseCard = ({ pose, index, onClick, t }) => {
	const diffLabels = {
		beginner: t("library.beginner"),
		intermediate: t("library.intermediate"),
		advanced: t("library.advanced"),
	};
	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
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
	const poseName =
		pose.englishName || pose.name || t("library.card_default_item");
	const poseSubtitle = pose.romanizationName || pose.sanskritName || null;
	const poseImage =
		pose.image || pose.media?.thumbnail?.url || pose.media?.images?.[0]?.url;
	const summaryDetails = [
		breathingCue
			? { label: t("library.poses_breathe"), value: breathingCue }
			: null,
		targetMuscles.length > 0
			? {
					label: t("library.poses_muscles"),
					value: targetMuscles.join(", "),
				}
			: null,
		jointFocus.length > 0
			? {
					label: t("library.poses_joints"),
					value: jointFocus.join(", "),
				}
			: null,
		drishti ? { label: t("library.poses_drishti"), value: drishti } : null,
		energyEffect
			? { label: t("library.poses_energy"), value: energyEffect }
			: null,
		sidedness ? { label: t("library.poses_side"), value: sidedness } : null,
	]
		.filter(Boolean)
		.slice(0, 3);

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.03, 0.3) }}
			onClick={onClick}
			className="group bg-[var(--paper-raised)] border border-[var(--ink)] rounded-2xl p-4 flex items-start gap-4  w-full text-left transition-all duration-200 hover: hover:-translate-y-[1px] active:scale-[0.995] cursor-pointer"
		>
			<div
				className="mt-0.5 flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden"
				style={{
					background: "var(--paper-raised)",
					border: "var(--ink-width) solid var(--ink)",
					borderRadius: "var(--radius-block)",
				}}
			>
				{poseImage ? (
					<img
						src={poseImage}
						alt={poseName}
						className="w-full h-full object-cover rounded-xl"
					/>
				) : (
					<PersonStanding size={30} style={{ color: "var(--chandra)" }} />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="font-semibold text-[var(--ink)] text-base leading-snug truncate">
							{poseName}
						</p>
						{poseSubtitle ? (
							<p className="text-[var(--ink-soft)] text-xs italic mt-0.5 truncate">
								{poseSubtitle}
							</p>
						) : null}
					</div>
					<div
						className="inline-flex items-center gap-1 text-[11px] font-semibold shrink-0"
						style={{ color: "var(--chandra)" }}
					>
						{tr("library.view_details", "View details")}
						<ChevronRight
							size={13}
							className="transition-transform group-hover:translate-x-0.5"
						/>
					</div>
				</div>
				<div className="flex gap-1.5 mt-2.5 flex-wrap">
					{pose.difficulty && (
						<Badge color={DIFF_COLORS[pose.difficulty] ?? "var(--ink-soft)"}>
							{diffLabels[pose.difficulty] ?? pose.difficulty}
						</Badge>
					)}
					{category && <Badge color="var(--chandra)">{category}</Badge>}
					{family && <Badge color="var(--chandra)">{family}</Badge>}
				</div>
				<div className="mt-3 flex flex-col gap-1.5 text-[11px] leading-relaxed text-[var(--ink-soft)]">
					{summaryDetails.map((detail) => (
						<p key={`${pose._id}-${detail.label}`} className="line-clamp-1">
							<span className="font-semibold text-[var(--ink)]">
								{detail.label}
							</span>{" "}
							{detail.value}
						</p>
					))}
					{secondary.length > 0 && (
						<p>
							<span className="font-semibold text-[var(--ink)]">
								{t("library.poses_type")}
							</span>{" "}
							{secondary.join(", ")}
						</p>
					)}
					{contraindications.length > 0 && (
						<p className="line-clamp-1">
							<span className="font-semibold text-[var(--ink)]">
								{t("library.poses_cautions")}
							</span>{" "}
							{contraindications.join(" · ")}
						</p>
					)}
				</div>
				{description && (
					<p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)] line-clamp-2">
						{description}
					</p>
				)}
				{benefits.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1.5">
						{benefits.map((benefit) => (
							<span
								key={`${pose._id}-benefit-${benefit}`}
								className="text-[10px] px-2 py-1 rounded-full"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--chandra) 12%, transparent)",
									color: "var(--ink-soft)",
								}}
							>
								{benefit}
							</span>
						))}
					</div>
				)}
			</div>
		</motion.button>
	);
};

const Poses = () => {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [poses, setPoses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [difficulty, setDifficulty] = useState("");
	const debounceRef = useRef(null);

	const DIFFICULTY_OPTIONS = [
		{
			key: "",
			label: t("library.poses_all_difficulties"),
			color: "var(--chandra)",
		},
		{
			key: "beginner",
			label: t("library.beginner"),
			color: "var(--ink)",
		},
		{
			key: "intermediate",
			label: t("library.intermediate"),
			color: "var(--surya)",
		},
		{
			key: "advanced",
			label: t("library.advanced"),
			color: "var(--alert)",
		},
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
		<main
			data-identity="next"
			className="flex min-h-0 flex-col pb-6 pt-4"
			style={{ background: "var(--paper)" }}
		>
			<header className="px-4 mb-4">
				<div className="flex items-center gap-3 mb-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						aria-label={t("session.back_home")}
						className="w-9 h-9 rounded-full bg-[var(--paper-raised)] border border-[var(--ink)] flex items-center justify-center shadow-sm"
					>
						<ChevronLeft
							size={20}
							aria-hidden="true"
							className="text-[var(--ink-soft)]"
						/>
					</button>
					<h1 className="font-display text-2xl font-bold text-[var(--ink)]">
						{t("library.tabs_poses")}
					</h1>
				</div>
				<SearchBar
					value={query}
					onChange={setQuery}
					placeholder={t("library.search")}
				/>
			</header>

			<div className="px-4 mb-4">
				<FilterChips
					options={DIFFICULTY_OPTIONS}
					selected={difficulty}
					onSelect={setDifficulty}
				/>
			</div>

			{loading ? (
				<div
					className="px-4 flex flex-col gap-3"
					aria-busy="true"
					aria-live="polite"
				>
					{["p1", "p2", "p3", "p4", "p5"].map((k) => (
						<SkeletonCard key={k} />
					))}
				</div>
			) : poses.length === 0 ? (
				<div className="px-4">
					<EmptyState
						icon={
							<PersonStanding size={56} style={{ color: "var(--chandra)" }} />
						}
						title={t("library.empty_poses")}
						description={t("library.empty_poses_hint")}
					/>
				</div>
			) : (
				<ul className="px-4 flex flex-col gap-3 list-none m-0 p-0">
					{poses.map((p, i) => (
						<li key={p._id}>
							<PoseCard
								pose={p}
								index={i}
								t={t}
								onClick={() => navigate(`/poses/${p._id}`)}
							/>
						</li>
					))}
				</ul>
			)}
		</main>
	);
};

export default Poses;

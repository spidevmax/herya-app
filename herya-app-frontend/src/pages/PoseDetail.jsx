import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	motion,
	useReducedMotion,
	useScroll,
	useTransform,
} from "framer-motion";
import {
	ChevronLeft,
	Frown,
	PersonStanding,
	Sparkles,
	Target,
	Wind,
} from "lucide-react";
import { getPoseById, getRelatedPoses } from "@/api/poses.api";
import { Badge, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const DIFF_COLORS = {
	beginner: "var(--color-info)",
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

const DetailBlock = ({ title, children, order = 0, reduceMotion = false }) => (
	<motion.div
		initial={reduceMotion ? false : { opacity: 0, y: 16 }}
		whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
		viewport={{ once: true, amount: 0.18 }}
		transition={
			reduceMotion
				? undefined
				: {
						type: "spring",
						stiffness: 190,
						damping: 24,
						delay: Math.min(order * 0.06, 0.32),
					}
		}
		className="rounded-2xl p-4 shadow-[var(--shadow-card)]"
		style={{ backgroundColor: "var(--color-surface-card)" }}
	>
		<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
			{title}
		</h3>
		{children}
	</motion.div>
);

function RelatedPoseChip({ pose, onClick }) {
	const relatedImage =
		pose.image || pose.media?.thumbnail?.url || pose.media?.images?.[0]?.url;

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
		>
			<div className="w-16 h-16 rounded-2xl bg-[var(--color-tone-info-bg)] flex items-center justify-center overflow-hidden">
				{relatedImage ? (
					<img
						src={relatedImage}
						alt={pose.englishName}
						className="w-full h-full object-cover"
					/>
				) : (
					<PersonStanding size={24} style={{ color: "var(--color-primary)" }} />
				)}
			</div>
			<p className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium leading-tight line-clamp-2">
				{pose.englishName}
			</p>
		</button>
	);
}

export default function PoseDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const heroRef = useRef(null);
	const prefersReducedMotion = useReducedMotion();
	const [pose, setPose] = useState(null);
	const [related, setRelated] = useState(null);
	const [loading, setLoading] = useState(true);
	const { scrollYProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"],
	});
	const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
	const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

	useEffect(() => {
		Promise.allSettled([getPoseById(id), getRelatedPoses(id)])
			.then(([p, r]) => {
				if (p.status === "fulfilled")
					setPose(p.value.data?.data || p.value.data);
				if (r.status === "fulfilled") {
					// Backend returns { basePose, preparatoryPoses, followUpPoses, counterposes }
					const payload = r.value.data?.data || r.value.data || {};
					setRelated(payload);
				}
			})
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<div className="px-4 pt-4 flex flex-col gap-4">
				<div className="h-56 rounded-3xl bg-[var(--color-surface-card)] animate-pulse" />
				<SkeletonCard lines={4} />
				<SkeletonCard lines={3} />
			</div>
		);
	}

	if (!pose) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<Frown
					size={52}
					className="mb-3"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<p className="font-display text-lg font-bold text-[var(--color-text-primary)]">
					{t("pose_detail.not_found")}
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-[var(--color-info)] text-sm font-semibold"
				>
					{t("pose_detail.back")}
				</button>
			</div>
		);
	}

	const diffLabels = {
		beginner: t("library.beginner"),
		intermediate: t("library.intermediate"),
		advanced: t("library.advanced"),
	};

	const benefits = normalizeList(pose.benefits);
	const contraindications = normalizeList(pose.contraindications);
	const targetMuscles = normalizeList(pose.targetMuscles);
	const jointFocus = normalizeList(pose.jointFocus);
	const commonMistakes = normalizeList(pose.commonMistakes);
	const props = normalizeList(pose.props);
	const aliases = normalizeList(pose.alias);
	const setupSteps = normalizeList(pose.instructions?.setup);
	const alignmentSteps = normalizeList(pose.instructions?.alignment);
	const modificationSteps = normalizeList(pose.instructions?.modifications);
	const exitSteps = normalizeList(pose.instructions?.exit);
	const keyPoints = normalizeList(pose.alignmentDetails?.keyPoints);
	const recommendedBreaths = pose.recommendedBreaths?.[pose.difficulty];
	const poseDisplayName = pose.englishName || pose.name;
	const poseDisplayRomanized = pose.romanizedName || pose.romanizationName;
	const poseDisplaySanskrit = pose.sanskritName;
	const poseImage =
		pose.image || pose.media?.thumbnail?.url || pose.media?.images?.[0]?.url;
	const poseDisplayCategory =
		typeof pose.category === "string"
			? pose.category.replace(/_/g, " ")
			: Array.isArray(pose.category)
				? pose.category.join(", ")
				: pose.category
					? String(pose.category)
					: null;
	const poseDisplayFamily =
		typeof pose.family === "string" ? pose.family.replace(/_/g, " ") : null;
	// Backend keys: preparatoryPoses, followUpPoses, counterposes
	const preparatory = related?.preparatoryPoses ?? [];
	const followUp = related?.followUpPoses ?? [];
	const counterposes = related?.counterposes ?? [];

	return (
		<div className="flex flex-col pb-10">
			{/* Hero image */}
			<div
				ref={heroRef}
				className="relative h-64 bg-[var(--color-tone-info-bg)] overflow-hidden"
			>
				{poseImage ? (
					<motion.img
						src={poseImage}
						alt={pose.englishName}
						className="w-full h-full object-cover"
						style={{ y: heroY, scale: heroScale }}
					/>
				) : (
					<motion.div
						className="w-full h-full flex items-center justify-center text-8xl"
						style={{ y: heroY, scale: heroScale }}
					>
						<PersonStanding
							size={84}
							style={{ color: "var(--color-primary)" }}
						/>
					</motion.div>
				)}
				<div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/18 via-transparent to-transparent" />
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
				>
					<ChevronLeft size={20} className="text-[var(--color-text-primary)]" />
				</button>
			</div>

			<div className="px-4 pt-5 flex flex-col gap-5">
				{/* Name & badges */}
				<motion.div
					initial={{ opacity: 0, y: 16, scale: 0.985 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 230, damping: 22 }}
					className="relative overflow-hidden rounded-[28px] p-[1px]"
					style={{
						background:
							"linear-gradient(130deg, color-mix(in srgb, var(--color-primary) 36%, transparent), color-mix(in srgb, var(--color-info) 34%, transparent), color-mix(in srgb, var(--color-secondary) 30%, transparent))",
					}}
				>
					<div
						className="relative rounded-[27px] px-5 py-5 overflow-hidden"
						style={{ backgroundColor: "var(--color-surface-card)" }}
					>
						<div
							className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-35"
							style={{ backgroundColor: "var(--color-primary-light)" }}
						/>
						<div
							className="absolute -left-10 -bottom-10 w-28 h-28 rounded-full blur-2xl opacity-25"
							style={{ backgroundColor: "var(--color-info)" }}
						/>

						<div className="relative flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h1 className="font-display text-2xl font-bold leading-tight text-[var(--color-text-primary)]">
									{poseDisplayName}
								</h1>
								{poseDisplayRomanized && (
									<p className="text-[var(--color-text-secondary)] text-sm mt-0.5 truncate">
										{poseDisplayRomanized}
									</p>
								)}
								{poseDisplaySanskrit && (
									<p className="text-[var(--color-text-muted)] text-xs italic truncate">
										{poseDisplaySanskrit}
									</p>
								)}
							</div>
							<div
								className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--color-primary) 12%, transparent)",
									color: "var(--color-primary)",
								}}
							>
								<Sparkles size={12} />
								Pose Profile
							</div>
						</div>

						<div className="flex flex-wrap gap-1.5 mt-3">
							{pose.difficulty && (
								<Badge
									color={
										DIFF_COLORS[pose.difficulty] ?? "var(--color-text-muted)"
									}
								>
									{diffLabels[pose.difficulty] ?? pose.difficulty}
								</Badge>
							)}
							{poseDisplayCategory && (
								<Badge color="var(--color-info)">{poseDisplayCategory}</Badge>
							)}
							{poseDisplayFamily && (
								<Badge color="var(--color-lavender)">{poseDisplayFamily}</Badge>
							)}
							{pose.drishti && (
								<Badge color="var(--color-warning)">
									{t("pose_detail.drishti")}: {formatValue(pose.drishti)}
								</Badge>
							)}
							{pose.energyEffect && (
								<Badge color="var(--color-success)">
									{formatValue(pose.energyEffect)}
								</Badge>
							)}
						</div>

						{(recommendedBreaths ||
							pose.sidedness?.type ||
							pose.breathingCue) && (
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
								{recommendedBreaths && (
									<div
										className="rounded-xl px-3 py-2.5 border"
										style={{
											backgroundColor: "var(--color-tone-info-bg)",
											borderColor:
												"color-mix(in srgb, var(--color-info) 24%, transparent)",
										}}
									>
										<p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] inline-flex items-center gap-1">
											<Wind size={11} />
											{t("pose_detail.breathing")}
										</p>
										<p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
											{recommendedBreaths.min}-{recommendedBreaths.max}{" "}
											{t("pose_detail.breaths")}
										</p>
									</div>
								)}
								{pose.sidedness?.type && (
									<div
										className="rounded-xl px-3 py-2.5 border"
										style={{
											backgroundColor: "var(--color-tone-warning-bg)",
											borderColor:
												"color-mix(in srgb, var(--color-warning) 24%, transparent)",
										}}
									>
										<p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] inline-flex items-center gap-1">
											<Target size={11} />
											{t("pose_detail.sidedness")}
										</p>
										<p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
											{formatValue(pose.sidedness.type)}
										</p>
									</div>
								)}
								{pose.breathingCue && (
									<div
										className="rounded-xl px-3 py-2.5 border"
										style={{
											backgroundColor: "var(--color-tone-success-bg)",
											borderColor:
												"color-mix(in srgb, var(--color-success) 24%, transparent)",
										}}
									>
										<p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] inline-flex items-center gap-1">
											<Wind size={11} />
											{t("pose_detail.breathe")}
										</p>
										<p className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1 mt-0.5">
											{formatValue(pose.breathingCue)}
										</p>
									</div>
								)}
							</div>
						)}

						{pose.description && (
							<p
								className="mt-4 text-[var(--color-text-secondary)] text-sm leading-relaxed border-l-2 pl-3"
								style={{
									borderColor:
										"color-mix(in srgb, var(--color-primary) 28%, transparent)",
								}}
							>
								{pose.description}
							</p>
						)}
					</div>
				</motion.div>

				<DetailBlock
					title={t("pose_detail.details")}
					order={0}
					reduceMotion={prefersReducedMotion}
				>
					{(pose.chakraRelated || pose.transitionType) && (
						<div className="flex flex-wrap gap-2 mb-4">
							{pose.chakraRelated && (
								<Badge color="var(--color-danger)">{pose.chakraRelated}</Badge>
							)}
							{pose.transitionType && (
								<Badge color="var(--color-primary)">
									{formatValue(pose.transitionType)}
								</Badge>
							)}
						</div>
					)}
					<div className="grid grid-cols-1 gap-3 text-sm text-[var(--color-text-secondary)]">
						{recommendedBreaths && (
							<p>
								<b className="text-[var(--color-text-primary)]">
									{t("pose_detail.breathing")}:
								</b>{" "}
								{recommendedBreaths.min} - {recommendedBreaths.max}{" "}
								{t("pose_detail.breaths")}
							</p>
						)}
						{pose.sidedness?.type && (
							<p>
								<b className="text-[var(--color-text-primary)]">
									{t("pose_detail.sidedness")}:
								</b>{" "}
								{formatValue(pose.sidedness.type)}
								{pose.sidedness.breathsPerSide
									? ` · ${pose.sidedness.breathsPerSide} ${t("pose_detail.breaths_per_side")}`
									: ""}
							</p>
						)}
						{formatValue(pose.breathingCue) && (
							<p>
								<b className="text-[var(--color-text-primary)]">
									{t("pose_detail.breathe")}
								</b>{" "}
								{formatValue(pose.breathingCue)}
							</p>
						)}
					</div>
				</DetailBlock>

				{aliases.length > 0 && (
					<DetailBlock
						title={t("pose_detail.aliases")}
						order={1}
						reduceMotion={prefersReducedMotion}
					>
						<p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
							{aliases.join(", ")}
						</p>
					</DetailBlock>
				)}

				{targetMuscles.length > 0 && (
					<DetailBlock
						title={t("pose_detail.target_muscles")}
						order={2}
						reduceMotion={prefersReducedMotion}
					>
						<div className="flex flex-wrap gap-2">
							{targetMuscles.map((muscle) => (
								<Badge key={`muscle-${muscle}`} color="var(--color-success)">
									{muscle}
								</Badge>
							))}
						</div>
					</DetailBlock>
				)}

				{jointFocus.length > 0 && (
					<DetailBlock
						title={t("pose_detail.joints")}
						order={3}
						reduceMotion={prefersReducedMotion}
					>
						<div className="flex flex-wrap gap-2">
							{jointFocus.map((joint) => (
								<Badge key={`joint-${joint}`} color="var(--color-warning)">
									{joint}
								</Badge>
							))}
						</div>
					</DetailBlock>
				)}

				{benefits.length > 0 && (
					<DetailBlock
						title={t("pose_detail.benefits")}
						order={4}
						reduceMotion={prefersReducedMotion}
					>
						<ul className="flex flex-col gap-2">
							{benefits.map((b) => (
								<li
									key={`benefit-${b}`}
									className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
								>
									<span className="text-[var(--color-info)] mt-0.5 flex-shrink-0">
										✓
									</span>
									{b}
								</li>
							))}
						</ul>
					</DetailBlock>
				)}

				{(setupSteps.length > 0 ||
					alignmentSteps.length > 0 ||
					modificationSteps.length > 0 ||
					exitSteps.length > 0 ||
					keyPoints.length > 0) && (
					<DetailBlock
						title={t("pose_detail.instructions")}
						order={5}
						reduceMotion={prefersReducedMotion}
					>
						<div className="flex flex-col gap-4">
							{setupSteps.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.setup")}
									</p>
									<ol className="flex flex-col gap-3">
										{setupSteps.map((step, i) => (
											<li
												key={`setup-${step}`}
												className="flex items-start gap-3"
											>
												<span className="w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
													{i + 1}
												</span>
												<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-1">
													{step}
												</p>
											</li>
										))}
									</ol>
								</div>
							)}
							{alignmentSteps.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.alignment")}
									</p>
									<ul className="flex flex-col gap-2">
										{alignmentSteps.map((step) => (
											<li
												key={`alignment-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span className="text-[var(--color-success)] mt-0.5 flex-shrink-0">
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</div>
							)}
							{modificationSteps.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.modifications")}
									</p>
									<ul className="flex flex-col gap-2">
										{modificationSteps.map((step) => (
											<li
												key={`mod-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span className="text-[var(--color-warning)] mt-0.5 flex-shrink-0">
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</div>
							)}
							{exitSteps.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.exit")}
									</p>
									<ul className="flex flex-col gap-2">
										{exitSteps.map((step) => (
											<li
												key={`exit-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span className="text-[var(--color-danger)] mt-0.5 flex-shrink-0">
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</div>
							)}
							{keyPoints.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.alignment_details")}
									</p>
									<ul className="flex flex-col gap-2">
										{keyPoints.map((point) => (
											<li
												key={`key-point-${point?.area || point?.instruction || String(point)}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed"
											>
												{formatValue(point?.area)}
												{point?.instruction ? `: ${point.instruction}` : ""}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</DetailBlock>
				)}

				{contraindications.length > 0 && (
					<DetailBlock
						title={t("pose_detail.contraindications")}
						order={6}
						reduceMotion={prefersReducedMotion}
					>
						<ul className="flex flex-col gap-2">
							{contraindications.map((item) => (
								<li
									key={`contra-${item}`}
									className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
								>
									<span className="text-[var(--color-danger)] mt-0.5 flex-shrink-0">
										•
									</span>
									<span>{item}</span>
								</li>
							))}
						</ul>
					</DetailBlock>
				)}

				{commonMistakes.length > 0 && (
					<DetailBlock
						title={t("pose_detail.common_mistakes")}
						order={7}
						reduceMotion={prefersReducedMotion}
					>
						<ul className="flex flex-col gap-2">
							{commonMistakes.map((item) => (
								<li
									key={`mistake-${item}`}
									className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
								>
									<span className="text-[var(--color-warning)] mt-0.5 flex-shrink-0">
										•
									</span>
									<span>{item}</span>
								</li>
							))}
						</ul>
					</DetailBlock>
				)}

				{props.length > 0 && (
					<DetailBlock
						title={t("pose_detail.props")}
						order={8}
						reduceMotion={prefersReducedMotion}
					>
						<div className="flex flex-wrap gap-2">
							{props.map((item) => (
								<Badge key={`prop-${item}`} color="var(--color-primary)">
									{item}
								</Badge>
							))}
						</div>
					</DetailBlock>
				)}

				{/* Related poses */}
				{(preparatory.length > 0 ||
					followUp.length > 0 ||
					counterposes.length > 0) && (
					<motion.div
						initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
						whileInView={
							prefersReducedMotion ? undefined : { opacity: 1, y: 0 }
						}
						viewport={{ once: true, amount: 0.15 }}
						transition={
							prefersReducedMotion
								? undefined
								: {
										type: "spring",
										stiffness: 180,
										damping: 24,
										delay: 0.28,
									}
						}
					>
						<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
							{t("pose_detail.related_poses")}
						</h3>
						<div className="flex flex-col gap-4">
							{preparatory.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.preparation")}
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{preparatory.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
							{followUp.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.continuation")}
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{followUp.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
							{counterposes.length > 0 && (
								<div>
									<p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
										{t("pose_detail.counterposes")}
									</p>
									<div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
										{counterposes.map((p) => (
											<RelatedPoseChip
												key={p._id}
												pose={p}
												onClick={() => navigate(`/poses/${p._id}`)}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}

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
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPoseById, getRelatedPoses } from "@/api/poses.api";
import { Badge, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
	localized,
	localizedArray,
	localizedName,
	translateWithFallback,
} from "@/utils/libraryHelpers";

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
	<motion.section
		aria-label={title}
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
		<h2 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
			{title}
		</h2>
		{children}
	</motion.section>
);

function RelatedPoseChip({ pose, onClick, lang }) {
	const relatedImage =
		pose.image || pose.media?.thumbnail?.url || pose.media?.images?.[0]?.url;
	const displayName = localizedName(pose, lang);

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
						alt={displayName}
						className="w-full h-full object-cover"
					/>
				) : (
					<PersonStanding size={24} style={{ color: "var(--color-primary)" }} />
				)}
			</div>
			<p className="text-[10px] text-center text-[var(--color-text-secondary)] font-medium leading-tight line-clamp-2">
				{displayName}
			</p>
		</button>
	);
}

export default function PoseDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
	const heroRef = useRef(null);
	const prefersReducedMotion = useReducedMotion();
	const [pose, setPose] = useState(null);
	const [related, setRelated] = useState(null);
	const [loading, setLoading] = useState(true);
	const { scrollYProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"],
	});
	const heroY = useTransform(
		scrollYProgress,
		[0, 1],
		prefersReducedMotion ? ["0%", "0%"] : ["0%", "14%"],
	);
	const heroScale = useTransform(
		scrollYProgress,
		[0, 1],
		prefersReducedMotion ? [1, 1] : [1, 1.08],
	);

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
			<main
				className="px-4 pt-4 flex flex-col gap-4"
				aria-busy="true"
				aria-live="polite"
			>
				<div
					className="h-56 rounded-3xl bg-[var(--color-surface-card)] animate-pulse"
					aria-hidden="true"
				/>
				<SkeletonCard lines={4} />
				<SkeletonCard lines={3} />
			</main>
		);
	}

	if (!pose) {
		return (
			<main className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<Frown
					size={52}
					aria-hidden="true"
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
			</main>
		);
	}

	const diffLabels = {
		beginner: t("library.beginner"),
		intermediate: t("library.intermediate"),
		advanced: t("library.advanced"),
	};

	const benefits =
		localizedArray(pose, "benefits", lang).length > 0
			? localizedArray(pose, "benefits", lang)
			: normalizeList(pose.benefits);
	const contraindications =
		localizedArray(pose, "contraindications", lang).length > 0
			? localizedArray(pose, "contraindications", lang)
			: normalizeList(pose.contraindications);
	const targetMuscles = normalizeList(pose.targetMuscles);
	const jointFocus = normalizeList(pose.jointFocus);
	const commonMistakes =
		localizedArray(pose, "commonMistakes", lang).length > 0
			? localizedArray(pose, "commonMistakes", lang)
			: normalizeList(pose.commonMistakes);
	const props = normalizeList(pose.props);
	const aliases = normalizeList(pose.alias);
	const setupSteps = normalizeList(pose.instructions?.setup);
	const alignmentSteps = normalizeList(pose.instructions?.alignment);
	const modificationSteps = normalizeList(pose.instructions?.modifications);
	const exitSteps = normalizeList(pose.instructions?.exit);
	const keyPoints = normalizeList(pose.alignmentDetails?.keyPoints);
	const recommendedBreaths = pose.recommendedBreaths?.[pose.difficulty];
	const poseDisplayName = localizedName(pose, lang);
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
		<main className="flex flex-col pb-10">
			{/* Hero image */}
			<figure
				ref={heroRef}
				className="relative h-64 bg-[var(--color-tone-info-bg)] overflow-hidden m-0"
			>
				{poseImage ? (
					<motion.img
						src={poseImage}
						alt={poseDisplayName}
						className="w-full h-full object-cover"
						style={{ y: heroY, scale: heroScale }}
					/>
				) : (
					<motion.div
						aria-hidden="true"
						className="w-full h-full flex items-center justify-center text-8xl"
						style={{ y: heroY, scale: heroScale }}
					>
						<PersonStanding
							size={84}
							style={{ color: "var(--color-primary)" }}
						/>
					</motion.div>
				)}
				<div
					aria-hidden="true"
					className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/18 via-transparent to-transparent"
				/>
				<button
					type="button"
					onClick={() => navigate(-1)}
					aria-label={t("pose_detail.back")}
					className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm"
				>
					<ChevronLeft
						size={20}
						aria-hidden="true"
						className="text-[var(--color-text-primary)]"
					/>
				</button>
			</figure>

			<div className="px-4 pt-5 flex flex-col gap-5">
				{/* Name & badges */}
				<motion.section
					aria-labelledby="pose-title"
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
							aria-hidden="true"
							className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-35"
							style={{ backgroundColor: "var(--color-primary-light)" }}
						/>
						<div
							aria-hidden="true"
							className="absolute -left-10 -bottom-10 w-28 h-28 rounded-full blur-2xl opacity-25"
							style={{ backgroundColor: "var(--color-info)" }}
						/>

						<div className="relative flex items-start justify-between gap-3">
							<div className="min-w-0">
								<h1
									id="pose-title"
									className="font-display text-2xl font-bold leading-tight text-[var(--color-text-primary)]"
								>
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
								<Sparkles size={12} aria-hidden="true" />
								{translateWithFallback(
									t,
									"pose_detail.profile_label",
									"Pose Profile",
								)}
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
								{(localized(pose, "breathingCue", lang) ||
									pose.breathingCue) && (
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
											{formatValue(localized(pose, "breathingCue", lang))}
										</p>
									</div>
								)}
							</div>
						)}

						{(localized(pose, "description", lang) || pose.description) && (
							<p
								className="mt-4 text-[var(--color-text-secondary)] text-sm leading-relaxed border-l-2 pl-3"
								style={{
									borderColor:
										"color-mix(in srgb, var(--color-primary) 28%, transparent)",
								}}
							>
								{localized(pose, "description", lang)}
							</p>
						)}
					</div>
				</motion.section>

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
						{formatValue(
							localized(pose, "breathingCue", lang) || pose.breathingCue,
						) && (
							<p>
								<b className="text-[var(--color-text-primary)]">
									{t("pose_detail.breathe")}
								</b>{" "}
								{formatValue(localized(pose, "breathingCue", lang))}
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
									{translateWithFallback(t, `anatomy.${muscle}`, muscle)}
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
									{translateWithFallback(t, `anatomy.${joint}`, joint)}
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
								<section aria-labelledby="instructions-setup-heading">
									<h3
										id="instructions-setup-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.setup")}
									</h3>
									<ol className="flex flex-col gap-3 list-none m-0 p-0">
										{setupSteps.map((step, i) => (
											<li
												key={`setup-${step}`}
												className="flex items-start gap-3"
											>
												<span
													aria-hidden="true"
													className="w-6 h-6 rounded-full bg-[var(--color-info)] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
												>
													{i + 1}
												</span>
												<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-1">
													{step}
												</p>
											</li>
										))}
									</ol>
								</section>
							)}
							{alignmentSteps.length > 0 && (
								<section aria-labelledby="instructions-alignment-heading">
									<h3
										id="instructions-alignment-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.alignment")}
									</h3>
									<ul className="flex flex-col gap-2 list-none m-0 p-0">
										{alignmentSteps.map((step) => (
											<li
												key={`alignment-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span
													aria-hidden="true"
													className="text-[var(--color-success)] mt-0.5 flex-shrink-0"
												>
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</section>
							)}
							{modificationSteps.length > 0 && (
								<section aria-labelledby="instructions-modifications-heading">
									<h3
										id="instructions-modifications-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.modifications")}
									</h3>
									<ul className="flex flex-col gap-2 list-none m-0 p-0">
										{modificationSteps.map((step) => (
											<li
												key={`mod-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span
													aria-hidden="true"
													className="text-[var(--color-warning)] mt-0.5 flex-shrink-0"
												>
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</section>
							)}
							{exitSteps.length > 0 && (
								<section aria-labelledby="instructions-exit-heading">
									<h3
										id="instructions-exit-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.exit")}
									</h3>
									<ul className="flex flex-col gap-2 list-none m-0 p-0">
										{exitSteps.map((step) => (
											<li
												key={`exit-${step}`}
												className="text-sm text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2"
											>
												<span
													aria-hidden="true"
													className="text-[var(--color-danger)] mt-0.5 flex-shrink-0"
												>
													•
												</span>
												<span>{step}</span>
											</li>
										))}
									</ul>
								</section>
							)}
							{keyPoints.length > 0 && (
								<section aria-labelledby="instructions-keypoints-heading">
									<h3
										id="instructions-keypoints-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.alignment_details")}
									</h3>
									<ul className="flex flex-col gap-2 list-none m-0 p-0">
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
								</section>
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
					<motion.section
						aria-labelledby="related-poses-heading"
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
						<h2
							id="related-poses-heading"
							className="font-display font-bold text-[var(--color-text-primary)] mb-3"
						>
							{t("pose_detail.related_poses")}
						</h2>
						<div className="flex flex-col gap-4">
							{preparatory.length > 0 && (
								<section aria-labelledby="related-preparation-heading">
									<h3
										id="related-preparation-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.preparation")}
									</h3>
									<ul className="flex gap-3 overflow-x-auto pb-1 no-scrollbar list-none m-0 p-0">
										{preparatory.map((p) => (
											<li key={p._id}>
												<RelatedPoseChip
													pose={p}
													lang={lang}
													onClick={() => navigate(`/library/pose/${p._id}`)}
												/>
											</li>
										))}
									</ul>
								</section>
							)}
							{followUp.length > 0 && (
								<section aria-labelledby="related-continuation-heading">
									<h3
										id="related-continuation-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.continuation")}
									</h3>
									<ul className="flex gap-3 overflow-x-auto pb-1 no-scrollbar list-none m-0 p-0">
										{followUp.map((p) => (
											<li key={p._id}>
												<RelatedPoseChip
													pose={p}
													lang={lang}
													onClick={() => navigate(`/library/pose/${p._id}`)}
												/>
											</li>
										))}
									</ul>
								</section>
							)}
							{counterposes.length > 0 && (
								<section aria-labelledby="related-counterposes-heading">
									<h3
										id="related-counterposes-heading"
										className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2"
									>
										{t("pose_detail.counterposes")}
									</h3>
									<ul className="flex gap-3 overflow-x-auto pb-1 no-scrollbar list-none m-0 p-0">
										{counterposes.map((p) => (
											<li key={p._id}>
												<RelatedPoseChip
													pose={p}
													lang={lang}
													onClick={() => navigate(`/library/pose/${p._id}`)}
												/>
											</li>
										))}
									</ul>
								</section>
							)}
						</div>
					</motion.section>
				)}
			</div>
		</main>
	);
}

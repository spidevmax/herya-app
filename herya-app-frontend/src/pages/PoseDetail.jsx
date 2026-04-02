import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
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

const DetailBlock = ({ title, children }) => (
	<div
		className="rounded-2xl p-4 shadow-[var(--shadow-card)]"
		style={{ backgroundColor: "var(--color-surface-card)" }}
	>
		<h3 className="font-display font-bold text-[var(--color-text-primary)] mb-3">
			{title}
		</h3>
		{children}
	</div>
);

function RelatedPoseChip({ pose, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
		>
			<div className="w-16 h-16 rounded-2xl bg-[var(--color-tone-info-bg)] flex items-center justify-center overflow-hidden">
				{pose.image ? (
					<img
						src={pose.image}
						alt={pose.englishName}
						className="w-full h-full object-cover"
					/>
				) : (
					<span className="text-2xl">🧘</span>
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
	const [pose, setPose] = useState(null);
	const [related, setRelated] = useState(null);
	const [loading, setLoading] = useState(true);

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
				<span className="text-5xl mb-3">😕</span>
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
	// Backend keys: preparatoryPoses, followUpPoses, counterposes
	const preparatory = related?.preparatoryPoses ?? [];
	const followUp = related?.followUpPoses ?? [];
	const counterposes = related?.counterposes ?? [];

	return (
		<div className="flex flex-col pb-10">
			{/* Hero image */}
			<div className="relative h-64 bg-[var(--color-tone-info-bg)]">
				{pose.image ? (
					<img
						src={pose.image}
						alt={pose.englishName}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-8xl">
						🧘
					</div>
				)}
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
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						{pose.englishName}
					</h1>
					{pose.romanizedName && (
						<p className="text-[var(--color-text-secondary)] text-sm mt-0.5">
							{pose.romanizedName}
						</p>
					)}
					{pose.sanskritName && (
						<p className="text-[var(--color-text-muted)] text-xs italic">
							{pose.sanskritName}
						</p>
					)}
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
						{pose.category && (
							<Badge color="var(--color-info)">
								{typeof pose.category === "string"
									? pose.category.replace(/_/g, " ")
									: Array.isArray(pose.category)
										? pose.category.join(", ")
										: String(pose.category)}
							</Badge>
						)}
						{pose.family && (
							<Badge color="var(--color-lavender)">
								{typeof pose.family === "string"
									? pose.family.replace(/_/g, " ")
									: String(pose.family)}
							</Badge>
						)}
						{pose.drishti && (
							<Badge color="var(--color-warning)">
								{t("pose_detail.drishti")}: {pose.drishti}
							</Badge>
						)}
						{pose.energyEffect && (
							<Badge color="var(--color-success)">{pose.energyEffect}</Badge>
						)}
					</div>
				</div>

				{/* Description */}
				{pose.description && (
					<p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
						{pose.description}
					</p>
				)}

				<DetailBlock title={t("pose_detail.details")}>
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
					<DetailBlock title={t("pose_detail.aliases")}>
						<p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
							{aliases.join(", ")}
						</p>
					</DetailBlock>
				)}

				{targetMuscles.length > 0 && (
					<DetailBlock title={t("pose_detail.target_muscles")}>
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
					<DetailBlock title={t("pose_detail.joints")}>
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
					<DetailBlock title={t("pose_detail.benefits")}>
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
					<DetailBlock title={t("pose_detail.instructions")}>
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
					<DetailBlock title={t("pose_detail.contraindications")}>
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
					<DetailBlock title={t("pose_detail.common_mistakes")}>
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
					<DetailBlock title={t("pose_detail.props")}>
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
					<div>
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
					</div>
				)}
			</div>
		</div>
	);
}

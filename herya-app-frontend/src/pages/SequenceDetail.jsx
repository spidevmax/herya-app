import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
	BookOpen,
	ChevronRight,
	Clock,
	Dumbbell,
	PersonStanding,
} from "lucide-react";
import { getSequenceById } from "@/api/sequences.api";
import { VK_FAMILY_MAP, LEVEL_LABELS } from "@/utils/constants";
import { colorMix } from "@/utils/libraryHelpers";
import { Badge, SkeletonCard, StickyHeader } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

export default function SequenceDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const tr = (key, fallback) => {
		const value = t(key);
		return value === key ? fallback : value;
	};
	const [seq, setSeq] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSequenceById(id)
			.then((r) => setSeq(r.data?.data || r.data))
			.catch(() => setSeq(null))
			.finally(() => setLoading(false));
	}, [id]);

	const family = seq
		? VK_FAMILY_MAP[seq.family] || {
				color: "var(--color-primary)",
				emoji: null,
				label: seq.family,
			}
		: null;

	const getPoseName = (pose, fallback) =>
		pose?.englishName || pose?.name || pose?.romanizationName || fallback;

	const getPoseSubtitle = (pose) =>
		pose?.romanizationName || pose?.sanskritName || null;

	const buildPoseItem = (
		pose,
		fallbackOrder,
		breaths = null,
		instruction = null,
	) => {
		if (!pose && !instruction) return null;
		const resolvedName =
			typeof pose === "string"
				? pose
				: getPoseName(pose, `Pose ${fallbackOrder}`);
		return {
			id:
				(typeof pose === "object" && pose?._id) ||
				`pose-${fallbackOrder}-${resolvedName}`,
			poseId: typeof pose === "object" ? pose?._id || null : null,
			order: fallbackOrder,
			name: resolvedName,
			subtitle: typeof pose === "object" ? getPoseSubtitle(pose) : null,
			breaths,
			instruction,
		};
	};

	const entrySteps = seq?.structure?.entry?.steps ?? [];
	const orderedCorePoses = (seq?.structure?.corePoses ?? [])
		.slice()
		.sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
	const exitSteps = seq?.structure?.exit?.steps ?? [];
	const prerequisites = Array.isArray(seq?.prerequisites)
		? seq.prerequisites
		: [];
	const nextSteps = Array.isArray(seq?.nextSteps) ? seq.nextSteps : [];
	const estimatedDuration = seq?.estimatedDuration ?? {};
	const therapeuticFocus = seq?.therapeuticFocus ?? null;
	const recommendedPranayama = seq?.recommendedPranayama?.pattern ?? null;

	const getItemName = (item, fallback) => {
		if (typeof item === "string") return item;
		return (
			item?.englishName || item?.name || item?.romanizationName || fallback
		);
	};

	const sequenceSections = [
		{
			key: "entry",
			label: t("sequence_detail.entry"),
			items:
				entrySteps.length > 0
					? entrySteps
							.map((step, index) =>
								buildPoseItem(
									step?.pose,
									index + 1,
									step?.breaths,
									step?.instruction,
								),
							)
							.filter(Boolean)
					: seq?.structure?.entry?.fromPose
						? [
								buildPoseItem(seq.structure.entry.fromPose, 1, null, null),
							].filter(Boolean)
						: [],
		},
		{
			key: "core",
			label: t("sequence_detail.core_poses"),
			items:
				orderedCorePoses.length > 0
					? orderedCorePoses
							.map((entry, index) =>
								buildPoseItem(
									entry?.pose,
									entry?.order ?? index + 1,
									entry?.breaths,
								),
							)
							.filter(Boolean)
					: (seq?.keyPoses ?? [])
							.map((pose, index) => buildPoseItem(pose, index + 1, null, null))
							.filter(Boolean),
		},
		{
			key: "exit",
			label: t("sequence_detail.exit"),
			items:
				exitSteps.length > 0
					? exitSteps
							.map((step, index) =>
								buildPoseItem(
									step?.pose,
									index + 1,
									step?.breaths,
									step?.instruction,
								),
							)
							.filter(Boolean)
					: seq?.structure?.exit?.toPose
						? [buildPoseItem(seq.structure.exit.toPose, 1, null, null)].filter(
								Boolean,
							)
						: [],
		},
	].filter((section) => section.items.length > 0);
	const hasAssignedPoses = sequenceSections.length > 0;
	const viewPoseLabel = tr("sequence_detail.view_pose", "View pose");

	return (
		<div className="pb-6">
			<StickyHeader
				onBack={() => navigate(-1)}
				title={loading ? t("sequence_detail.loading") : seq?.englishName}
			/>

			{loading ? (
				<div className="px-4 flex flex-col gap-4 mt-2">
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</div>
			) : !seq ? (
				<div className="px-4 mt-8 text-center text-[#9CA3AF]">
					{t("sequence_detail.not_found")}
				</div>
			) : (
				<div className="px-4 flex flex-col gap-5 mt-2">
					<motion.div
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						className="rounded-3xl p-6 relative overflow-hidden"
						style={{
							background: `linear-gradient(135deg, ${family.color}, ${colorMix(family.color, 67)})`,
						}}
					>
						<div className="absolute right-4 bottom-4 opacity-20 float select-none">
							{family.emoji ? (
								<span className="text-8xl">{family.emoji}</span>
							) : (
								<PersonStanding
									size={88}
									strokeWidth={1.8}
									className="text-white"
								/>
							)}
						</div>
						<span className="text-white/80 text-xs font-bold uppercase tracking-widest">
							{family.label}
						</span>
						<h2 className="font-display text-2xl font-bold text-white mt-1 mb-1">
							{seq.englishName}
						</h2>
						<p className="text-white/70 text-sm italic mb-4">
							{seq.sanskritName}
						</p>
						<div className="flex flex-wrap gap-2">
							{seq.estimatedDuration?.recommended && (
								<Badge className="text-white bg-white/20 border-0">
									<Clock size={12} />
									{seq.estimatedDuration.recommended}{" "}
									{t("sequence_detail.minutes")}
								</Badge>
							)}
							{seq.level && (
								<Badge className="text-white bg-white/20 border-0">
									<Dumbbell size={12} />
									{LEVEL_LABELS[seq.level] ?? seq.level}
								</Badge>
							)}
							{seq.difficulty && (
								<Badge className="text-white bg-white/20 border-0 capitalize">
									{seq.difficulty}
								</Badge>
							)}
						</div>
					</motion.div>

					{seq.description && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-2"
								style={{ color: "var(--color-text-primary)" }}
							>
								{t("sequence_detail.about")}
							</h3>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{seq.description}
							</p>
						</div>
					)}

					{(estimatedDuration.recommended ||
						estimatedDuration.min ||
						estimatedDuration.max ||
						seq.level ||
						seq.difficulty) && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3"
								style={{ color: "var(--color-text-primary)" }}
							>
								{tr("sequence_detail.details", "Details")}
							</h3>
							<div className="grid grid-cols-2 gap-2">
								{seq.level ? (
									<div
										className="rounded-xl px-3 py-2"
										style={{ backgroundColor: `${colorMix(family.color, 7)}` }}
									>
										<p
											className="text-[10px] font-bold uppercase tracking-widest"
											style={{ color: family.color }}
										>
											{tr("library.filter_level", "Level")}
										</p>
										<p
											className="text-sm font-semibold mt-0.5"
											style={{ color: "var(--color-text-primary)" }}
										>
											{LEVEL_LABELS[seq.level] ?? seq.level}
										</p>
									</div>
								) : null}
								{seq.difficulty ? (
									<div
										className="rounded-xl px-3 py-2"
										style={{ backgroundColor: `${colorMix(family.color, 7)}` }}
									>
										<p
											className="text-[10px] font-bold uppercase tracking-widest"
											style={{ color: family.color }}
										>
											{tr("library.filter_difficulty", "Difficulty")}
										</p>
										<p
											className="text-sm font-semibold mt-0.5 capitalize"
											style={{ color: "var(--color-text-primary)" }}
										>
											{seq.difficulty}
										</p>
									</div>
								) : null}
								{estimatedDuration.recommended ||
								estimatedDuration.min ||
								estimatedDuration.max ? (
									<div
										className="rounded-xl px-3 py-2"
										style={{ backgroundColor: `${colorMix(family.color, 7)}` }}
									>
										<p
											className="text-[10px] font-bold uppercase tracking-widest"
											style={{ color: family.color }}
										>
											{tr(
												"sequence_detail.estimated_duration",
												"Estimated duration",
											)}
										</p>
										<p
											className="text-sm font-semibold mt-0.5"
											style={{ color: "var(--color-text-primary)" }}
										>
											{estimatedDuration.recommended ??
												estimatedDuration.min ??
												"—"}
											{estimatedDuration.max ? `-${estimatedDuration.max}` : ""}{" "}
											{t("sequence_detail.minutes")}
										</p>
									</div>
								) : null}
								{seq.family ? (
									<div
										className="rounded-xl px-3 py-2"
										style={{ backgroundColor: `${colorMix(family.color, 7)}` }}
									>
										<p
											className="text-[10px] font-bold uppercase tracking-widest"
											style={{ color: family.color }}
										>
											{tr("library.filter_family", "Family")}
										</p>
										<p
											className="text-sm font-semibold mt-0.5 capitalize"
											style={{ color: "var(--color-text-primary)" }}
										>
											{seq.family.replace(/_/g, " ")}
										</p>
									</div>
								) : null}
							</div>
						</div>
					)}

					{therapeuticFocus && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3"
								style={{ color: "var(--color-text-primary)" }}
							>
								{tr("sequence_detail.therapeutic_focus", "Therapeutic focus")}
							</h3>
							{therapeuticFocus.primaryBenefit ? (
								<p
									className="text-sm leading-relaxed"
									style={{ color: "var(--color-text-secondary)" }}
								>
									<span
										className="font-semibold"
										style={{ color: family.color }}
									>
										{tr("sequence_detail.primary_benefit", "Primary benefit")}:
									</span>
									{therapeuticFocus.primaryBenefit}
								</p>
							) : null}
							{Array.isArray(therapeuticFocus.targetConditions) &&
							therapeuticFocus.targetConditions.length > 0 ? (
								<div className="mt-3">
									<p
										className="text-xs font-bold uppercase tracking-widest mb-2"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{tr(
											"sequence_detail.target_conditions",
											"Target conditions",
										)}
									</p>
									<div className="flex flex-wrap gap-2">
										{therapeuticFocus.targetConditions.map((condition) => (
											<Badge
												key={condition}
												className="text-xs"
												color={family.color}
											>
												{condition}
											</Badge>
										))}
									</div>
								</div>
							) : null}
							{Array.isArray(therapeuticFocus.contraindications) &&
							therapeuticFocus.contraindications.length > 0 ? (
								<div className="mt-3">
									<p
										className="text-xs font-bold uppercase tracking-widest mb-2"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{tr(
											"sequence_detail.contraindications",
											"Contraindications",
										)}
									</p>
									<ul className="flex flex-col gap-1.5">
										{therapeuticFocus.contraindications.map((item) => (
											<li
												key={item}
												className="text-sm"
												style={{ color: "var(--color-text-secondary)" }}
											>
												• {item}
											</li>
										))}
									</ul>
								</div>
							) : null}
						</div>
					)}

					{recommendedPranayama && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3"
								style={{ color: "var(--color-text-primary)" }}
							>
								{tr(
									"sequence_detail.recommended_pranayama",
									"Recommended pranayama",
								)}
							</h3>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{getItemName(
									recommendedPranayama,
									recommendedPranayama.englishName || recommendedPranayama.name,
								)}
							</p>
						</div>
					)}

					{prerequisites.length > 0 && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3"
								style={{ color: "var(--color-text-primary)" }}
							>
								{tr("sequence_detail.prerequisites", "Prerequisites")}
							</h3>
							<div className="flex flex-wrap gap-2">
								{prerequisites.map((item) => (
									<Badge
										key={item._id || item.englishName || item.name}
										color={family.color}
									>
										{getItemName(item, t("library.card_default_item"))}
									</Badge>
								))}
							</div>
						</div>
					)}

					{nextSteps.length > 0 && (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3"
								style={{ color: "var(--color-text-primary)" }}
							>
								{tr("sequence_detail.next_steps", "Next steps")}
							</h3>
							<div className="flex flex-col gap-2">
								{nextSteps.map((step) => {
									const nextSequence = step?.sequence || step;
									return (
										<div
											key={
												nextSequence._id ||
												nextSequence.englishName ||
												nextSequence.name
											}
											className="rounded-xl px-3 py-2 border"
											style={{ borderColor: `${colorMix(family.color, 20)}` }}
										>
											<p
												className="text-sm font-semibold"
												style={{ color: "var(--color-text-primary)" }}
											>
												{getItemName(
													nextSequence,
													t("library.card_default_item"),
												)}
											</p>
											{step?.whenToUse ? (
												<p
													className="text-xs mt-1"
													style={{ color: "var(--color-text-secondary)" }}
												>
													{step.whenToUse}
												</p>
											) : null}
										</div>
									);
								})}
							</div>
						</div>
					)}

					{hasAssignedPoses ? (
						<div
							className="rounded-2xl p-5"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<h3
								className="font-semibold mb-3 flex items-center gap-2"
								style={{ color: "var(--color-text-primary)" }}
							>
								<BookOpen size={16} /> {t("sequence_detail.full_sequence")}
							</h3>
							<p
								className="text-xs font-medium mb-4"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("sequence_detail.postures_count", {
									n: sequenceSections.reduce(
										(sum, section) => sum + section.items.length,
										0,
									),
								})}
							</p>
							<div className="flex flex-col gap-4">
								{sequenceSections.map((section) => (
									<div key={section.key} className="flex flex-col gap-2">
										<h4
											className="text-xs font-bold uppercase tracking-widest"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{section.label}
										</h4>
										<ol className="flex flex-col gap-2">
											{section.items.map((pose) => (
												<li
													key={pose.id}
													className="rounded-xl border"
													style={{ borderColor: `${colorMix(family.color, 20)}` }}
												>
													{pose.poseId ? (
														<button
															type="button"
															onClick={() =>
																navigate(`/library/pose/${pose.poseId}`)
															}
															aria-label={`${viewPoseLabel}: ${pose.name}`}
															className="group w-full rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-left transition hover:brightness-95 hover:-translate-y-[1px] cursor-pointer"
															style={{ backgroundColor: `${colorMix(family.color, 6)}` }}
														>
															<div className="min-w-0">
																<p
																	className="text-sm font-semibold truncate"
																	style={{ color: "var(--color-text-primary)" }}
																>
																	{pose.order}. {pose.name}
																</p>
																{pose.subtitle &&
																pose.subtitle !== pose.name ? (
																	<p
																		className="text-xs truncate"
																		style={{
																			color: "var(--color-text-secondary)",
																		}}
																	>
																		{pose.subtitle}
																	</p>
																) : null}
																{pose.instruction ? (
																	<p
																		className="text-xs mt-1"
																		style={{ color: "var(--color-text-muted)" }}
																	>
																		{pose.instruction}
																	</p>
																) : null}
															</div>
															<div className="flex items-center gap-2 shrink-0">
																{typeof pose.breaths === "number" ? (
																	<span
																		className="text-xs font-semibold px-2 py-1 rounded-lg"
																		style={{
																			backgroundColor: `${colorMix(family.color, 13)}`,
																			color: family.color,
																		}}
																	>
																		{t("sequence_detail.breaths", {
																			n: pose.breaths,
																		})}
																	</span>
																) : null}
																<span
																	className="text-[11px] font-semibold inline-flex items-center gap-1"
																	style={{ color: family.color }}
																>
																	{viewPoseLabel}
																	<ChevronRight
																		size={12}
																		className="transition-transform group-hover:translate-x-0.5"
																	/>
																</span>
															</div>
														</button>
													) : (
														<div
															className="w-full rounded-xl px-3 py-2 flex items-center justify-between gap-3"
															style={{ backgroundColor: `${colorMix(family.color, 6)}` }}
														>
															<div className="min-w-0">
																<p
																	className="text-sm font-semibold truncate"
																	style={{ color: "var(--color-text-primary)" }}
																>
																	{pose.order}. {pose.name}
																</p>
																{pose.subtitle &&
																pose.subtitle !== pose.name ? (
																	<p
																		className="text-xs truncate"
																		style={{
																			color: "var(--color-text-secondary)",
																		}}
																	>
																		{pose.subtitle}
																	</p>
																) : null}
																{pose.instruction ? (
																	<p
																		className="text-xs mt-1"
																		style={{ color: "var(--color-text-muted)" }}
																	>
																		{pose.instruction}
																	</p>
																) : null}
															</div>
															{typeof pose.breaths === "number" ? (
																<span
																	className="text-xs font-semibold px-2 py-1 rounded-lg"
																	style={{
																		backgroundColor: `${colorMix(family.color, 13)}`,
																		color: family.color,
																	}}
																>
																	{t("sequence_detail.breaths", {
																		n: pose.breaths,
																	})}
																</span>
															) : null}
														</div>
													)}
												</li>
											))}
										</ol>
									</div>
								))}
							</div>
						</div>
					) : (
						<div
							className="rounded-2xl p-5 border"
							style={{
								backgroundColor: "var(--color-surface-card)",
								borderColor: `${colorMix(family.color, 20)}`,
							}}
						>
							<h3
								className="font-semibold mb-2 flex items-center gap-2"
								style={{ color: "var(--color-text-primary)" }}
							>
								<BookOpen size={16} />
								{t("sequence_detail.full_sequence")}
							</h3>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{tr(
									"sequence_detail.no_poses_assigned",
									"This sequence has no poses assigned yet in the backend data.",
								)}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

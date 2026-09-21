import { motion } from "framer-motion";
import {
	BookOpen,
	ChevronRight,
	Clock,
	Dumbbell,
	PersonStanding,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSequenceById } from "@/api/sequences.api";
import { Badge, SkeletonCard, StickyHeader } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";
import {
	LEVEL_LABEL_KEYS,
	LEVEL_LABELS,
	VK_FAMILY_BY_SLUG,
} from "@/utils/constants";
import { localized, localizedName } from "@/utils/libraryHelpers";

export default function SequenceDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
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
		? VK_FAMILY_BY_SLUG[seq.family] || {
				color: "var(--chandra)",
				emoji: null,
				label: seq.family,
			}
		: null;

	const getPoseName = (pose, fallback) =>
		localizedName(pose, lang) || pose?.romanizationName || fallback;

	const getPoseSubtitle = (pose) =>
		pose?.romanizationName || pose?.sanskritName || null;

	const localizeInstruction = (instruction) => {
		if (!instruction) return null;
		const enterMatch = instruction.match(/^Enter from (.+)$/);
		if (enterMatch)
			return t("sequence_detail.enter_from", { pose: enterMatch[1] });
		const returnMatch = instruction.match(/^Return to (.+)$/);
		if (returnMatch)
			return t("sequence_detail.return_to", { pose: returnMatch[1] });
		return instruction;
	};

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
			instruction: localizeInstruction(instruction),
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
		return localizedName(item, lang) || item?.romanizationName || fallback;
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
		<main
			data-identity="next"
			className="pb-6"
			style={{ background: "var(--paper)" }}
		>
			<StickyHeader
				onBack={() => navigate(-1)}
				title={
					loading ? t("sequence_detail.loading") : localizedName(seq, lang)
				}
			/>

			{loading ? (
				<div
					className="px-4 flex flex-col gap-4 mt-2"
					aria-busy="true"
					aria-live="polite"
				>
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</div>
			) : !seq ? (
				<p className="px-4 mt-8 text-center text-[#9CA3AF]" role="alert">
					{t("sequence_detail.not_found")}
				</p>
			) : (
				<div className="px-4 flex flex-col gap-5 mt-2">
					<motion.section
						aria-labelledby="sequence-title"
						initial={{ opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						className="ink-block relative overflow-hidden p-6"
						style={{ background: "var(--surya)", color: "var(--on-fill)" }}
					>
						<div
							aria-hidden="true"
							className="absolute bottom-4 right-4 select-none opacity-60"
						>
							{family.emoji ? (
								<span className="text-8xl">{family.emoji}</span>
							) : (
								<PersonStanding
									size={88}
									strokeWidth={1.8}
									style={{ color: "var(--on-fill)" }}
								/>
							)}
						</div>
						<p className="text-xs font-bold" style={{ opacity: 0.8 }}>
							{family.labelKey ? t(family.labelKey) : family.label}
						</p>
						<h1
							id="sequence-title"
							className="font-display text-2xl font-bold  mt-1 mb-1"
						>
							{localizedName(seq, lang)}
						</h1>
						<p className="mb-4 text-sm italic" style={{ opacity: 0.75 }}>
							{seq.sanskritName}
						</p>
						<ul className="flex flex-wrap gap-2 list-none m-0 p-0">
							{seq.estimatedDuration?.recommended && (
								<li>
									<Badge className=" bg-white/20 border-0">
										<Clock size={12} aria-hidden="true" />
										{seq.estimatedDuration.recommended}{" "}
										{t("sequence_detail.minutes")}
									</Badge>
								</li>
							)}
							{seq.level && (
								<li>
									<Badge className=" bg-white/20 border-0">
										<Dumbbell size={12} aria-hidden="true" />
										{LEVEL_LABEL_KEYS[seq.level]
											? t(LEVEL_LABEL_KEYS[seq.level])
											: (LEVEL_LABELS[seq.level] ?? seq.level)}
									</Badge>
								</li>
							)}
							{seq.difficulty && (
								<li>
									<Badge className=" bg-white/20 border-0 capitalize">
										{tr(`library.${seq.difficulty}`, seq.difficulty)}
									</Badge>
								</li>
							)}
						</ul>
					</motion.section>

					{(localized(seq, "description", lang) || seq.description) && (
						<section
							aria-labelledby="sequence-about-heading"
							className="ink-block p-5"
						>
							<h2
								id="sequence-about-heading"
								className="font-semibold mb-2"
								style={{ color: "var(--ink)" }}
							>
								{t("sequence_detail.about")}
							</h2>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--ink-soft)" }}
							>
								{localized(seq, "description", lang)}
							</p>
						</section>
					)}

					{(estimatedDuration.recommended ||
						estimatedDuration.min ||
						estimatedDuration.max ||
						seq.level ||
						seq.difficulty) && (
						<section
							aria-labelledby="sequence-details-heading"
							className="ink-block p-5"
						>
							<h2
								id="sequence-details-heading"
								className="font-semibold mb-3"
								style={{ color: "var(--ink)" }}
							>
								{tr("sequence_detail.details", "Details")}
							</h2>
							<dl className="grid grid-cols-2 gap-2">
								{seq.level ? (
									<div
										className="px-3 py-2"
										style={{
											background: "var(--paper)",
											border: "var(--ink-width) solid var(--ink)",
											borderRadius: "var(--radius-block)",
										}}
									>
										<dt
											className="text-[10px] font-bold"
											style={{ color: "var(--ink-soft)" }}
										>
											{tr("library.filter_level", "Level")}
										</dt>
										<dd
											className="text-sm font-semibold mt-0.5"
											style={{ color: "var(--ink)" }}
										>
											{LEVEL_LABEL_KEYS[seq.level]
												? t(LEVEL_LABEL_KEYS[seq.level])
												: (LEVEL_LABELS[seq.level] ?? seq.level)}
										</dd>
									</div>
								) : null}
								{seq.difficulty ? (
									<div
										className="px-3 py-2"
										style={{
											background: "var(--paper)",
											border: "var(--ink-width) solid var(--ink)",
											borderRadius: "var(--radius-block)",
										}}
									>
										<dt
											className="text-[10px] font-bold"
											style={{ color: "var(--ink-soft)" }}
										>
											{tr("library.filter_difficulty", "Difficulty")}
										</dt>
										<dd
											className="text-sm font-semibold mt-0.5 capitalize"
											style={{ color: "var(--ink)" }}
										>
											{tr(`library.${seq.difficulty}`, seq.difficulty)}
										</dd>
									</div>
								) : null}
								{estimatedDuration.recommended ||
								estimatedDuration.min ||
								estimatedDuration.max ? (
									<div
										className="px-3 py-2"
										style={{
											background: "var(--paper)",
											border: "var(--ink-width) solid var(--ink)",
											borderRadius: "var(--radius-block)",
										}}
									>
										<dt
											className="text-[10px] font-bold"
											style={{ color: "var(--ink-soft)" }}
										>
											{tr(
												"sequence_detail.estimated_duration",
												"Estimated duration",
											)}
										</dt>
										<dd
											className="text-sm font-semibold mt-0.5"
											style={{ color: "var(--ink)" }}
										>
											{estimatedDuration.recommended ??
												estimatedDuration.min ??
												"—"}
											{estimatedDuration.max ? `-${estimatedDuration.max}` : ""}{" "}
											{t("sequence_detail.minutes")}
										</dd>
									</div>
								) : null}
								{seq.family ? (
									<div
										className="px-3 py-2"
										style={{
											background: "var(--paper)",
											border: "var(--ink-width) solid var(--ink)",
											borderRadius: "var(--radius-block)",
										}}
									>
										<dt
											className="text-[10px] font-bold"
											style={{ color: "var(--ink-soft)" }}
										>
											{tr("library.filter_family", "Family")}
										</dt>
										<dd
											className="text-sm font-semibold mt-0.5 capitalize"
											style={{ color: "var(--ink)" }}
										>
											{seq.family.replace(/_/g, " ")}
										</dd>
									</div>
								) : null}
							</dl>
						</section>
					)}

					{therapeuticFocus && (
						<section
							aria-labelledby="therapeutic-focus-heading"
							className="ink-block p-5"
						>
							<h2
								id="therapeutic-focus-heading"
								className="font-semibold mb-3"
								style={{ color: "var(--ink)" }}
							>
								{tr("sequence_detail.therapeutic_focus", "Therapeutic focus")}
							</h2>
							{localized(therapeuticFocus, "primaryBenefit", lang) ||
							therapeuticFocus.primaryBenefit ? (
								<p
									className="text-sm leading-relaxed"
									style={{ color: "var(--ink-soft)" }}
								>
									<span
										className="font-semibold"
										style={{ color: "var(--ink-soft)" }}
									>
										{tr("sequence_detail.primary_benefit", "Primary benefit")}:
									</span>
									{localized(therapeuticFocus, "primaryBenefit", lang)}
								</p>
							) : null}
							{Array.isArray(therapeuticFocus.targetConditions) &&
							therapeuticFocus.targetConditions.length > 0 ? (
								<section
									aria-labelledby="target-conditions-heading"
									className="mt-3"
								>
									<h3
										id="target-conditions-heading"
										className="text-xs font-bold mb-2"
										style={{ color: "var(--ink-soft)" }}
									>
										{tr(
											"sequence_detail.target_conditions",
											"Target conditions",
										)}
									</h3>
									<ul className="flex flex-wrap gap-2 list-none m-0 p-0">
										{therapeuticFocus.targetConditions.map((condition) => (
											<li key={condition}>
												<Badge className="text-xs" color="var(--ink)">
													{condition}
												</Badge>
											</li>
										))}
									</ul>
								</section>
							) : null}
							{Array.isArray(therapeuticFocus.contraindications) &&
							therapeuticFocus.contraindications.length > 0 ? (
								<section
									aria-labelledby="contraindications-heading"
									className="mt-3"
								>
									<h3
										id="contraindications-heading"
										className="text-xs font-bold mb-2"
										style={{ color: "var(--ink-soft)" }}
									>
										{tr(
											"sequence_detail.contraindications",
											"Contraindications",
										)}
									</h3>
									<ul className="flex flex-col gap-1.5 list-none m-0 p-0">
										{therapeuticFocus.contraindications.map((item) => (
											<li
												key={item}
												className="text-sm"
												style={{ color: "var(--ink-soft)" }}
											>
												<span aria-hidden="true">• </span>
												{item}
											</li>
										))}
									</ul>
								</section>
							) : null}
						</section>
					)}

					{recommendedPranayama && (
						<section
							aria-labelledby="recommended-pranayama-heading"
							className="ink-block p-5"
						>
							<h2
								id="recommended-pranayama-heading"
								className="font-semibold mb-3"
								style={{ color: "var(--ink)" }}
							>
								{tr(
									"sequence_detail.recommended_pranayama",
									"Recommended pranayama",
								)}
							</h2>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--ink-soft)" }}
							>
								{getItemName(
									recommendedPranayama,
									recommendedPranayama.englishName || recommendedPranayama.name,
								)}
							</p>
						</section>
					)}

					{prerequisites.length > 0 && (
						<section
							aria-labelledby="prerequisites-heading"
							className="ink-block p-5"
						>
							<h2
								id="prerequisites-heading"
								className="font-semibold mb-3"
								style={{ color: "var(--ink)" }}
							>
								{tr("sequence_detail.prerequisites", "Prerequisites")}
							</h2>
							<ul className="flex flex-wrap gap-2 list-none m-0 p-0">
								{prerequisites.map((item) => (
									<li key={item._id || item.englishName || item.name}>
										<Badge color="var(--ink)">
											{getItemName(item, t("library.card_default_item"))}
										</Badge>
									</li>
								))}
							</ul>
						</section>
					)}

					{nextSteps.length > 0 && (
						<section
							aria-labelledby="next-steps-heading"
							className="ink-block p-5"
						>
							<h2
								id="next-steps-heading"
								className="font-semibold mb-3"
								style={{ color: "var(--ink)" }}
							>
								{tr("sequence_detail.next_steps", "Next steps")}
							</h2>
							<ul className="flex flex-col gap-2 list-none m-0 p-0">
								{nextSteps.map((step) => {
									const nextSequence = step?.sequence || step;
									return (
										<li
											key={
												nextSequence._id ||
												nextSequence.englishName ||
												nextSequence.name
											}
											className="rounded-xl px-3 py-2 border"
											style={{ borderColor: "var(--ink)" }}
										>
											<p
												className="text-sm font-semibold"
												style={{ color: "var(--ink)" }}
											>
												{getItemName(
													nextSequence,
													t("library.card_default_item"),
												)}
											</p>
											{step?.whenToUse ? (
												<p
													className="text-xs mt-1"
													style={{ color: "var(--ink-soft)" }}
												>
													{step.whenToUse}
												</p>
											) : null}
										</li>
									);
								})}
							</ul>
						</section>
					)}

					{hasAssignedPoses ? (
						<section
							aria-labelledby="full-sequence-heading"
							className="ink-block p-5"
						>
							<h2
								id="full-sequence-heading"
								className="font-semibold mb-3 flex items-center gap-2"
								style={{ color: "var(--ink)" }}
							>
								<BookOpen size={16} aria-hidden="true" />{" "}
								{t("sequence_detail.full_sequence")}
							</h2>
							<p
								className="text-xs font-medium mb-4"
								style={{ color: "var(--ink-soft)" }}
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
									<section
										key={section.key}
										aria-labelledby={`sequence-section-${section.key}`}
										className="flex flex-col gap-2"
									>
										<h3
											id={`sequence-section-${section.key}`}
											className="text-xs font-bold"
											style={{ color: "var(--ink-soft)" }}
										>
											{section.label}
										</h3>
										<ol className="flex flex-col gap-2 list-none m-0 p-0">
											{section.items.map((pose) => (
												<li
													key={pose.id}
													className="rounded-xl border"
													style={{
														borderColor: "var(--ink)",
													}}
												>
													{pose.poseId ? (
														<button
															type="button"
															onClick={() =>
																navigate(`/library/pose/${pose.poseId}`)
															}
															aria-label={`${viewPoseLabel}: ${pose.name}`}
															className="group w-full rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-left transition hover:brightness-95 hover:-translate-y-[1px] cursor-pointer"
															style={{
																backgroundColor: "var(--paper-raised)",
															}}
														>
															<div className="min-w-0">
																<p
																	className="text-sm font-semibold truncate"
																	style={{ color: "var(--ink)" }}
																>
																	{pose.order}. {pose.name}
																</p>
																{pose.subtitle &&
																pose.subtitle !== pose.name ? (
																	<p
																		className="text-xs truncate"
																		style={{
																			color: "var(--ink-soft)",
																		}}
																	>
																		{pose.subtitle}
																	</p>
																) : null}
																{pose.instruction ? (
																	<p
																		className="text-xs mt-1"
																		style={{ color: "var(--ink-soft)" }}
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
																			backgroundColor: "var(--paper-raised)",
																			color: "var(--ink)",
																		}}
																	>
																		{t("sequence_detail.breaths", {
																			n: pose.breaths,
																		})}
																	</span>
																) : null}
																<span
																	className="text-[11px] font-semibold inline-flex items-center gap-1"
																	style={{ color: "var(--ink-soft)" }}
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
															style={{
																backgroundColor: "var(--paper-raised)",
															}}
														>
															<div className="min-w-0">
																<p
																	className="text-sm font-semibold truncate"
																	style={{ color: "var(--ink)" }}
																>
																	{pose.order}. {pose.name}
																</p>
																{pose.subtitle &&
																pose.subtitle !== pose.name ? (
																	<p
																		className="text-xs truncate"
																		style={{
																			color: "var(--ink-soft)",
																		}}
																	>
																		{pose.subtitle}
																	</p>
																) : null}
																{pose.instruction ? (
																	<p
																		className="text-xs mt-1"
																		style={{ color: "var(--ink-soft)" }}
																	>
																		{pose.instruction}
																	</p>
																) : null}
															</div>
															{typeof pose.breaths === "number" ? (
																<span
																	className="text-xs font-semibold px-2 py-1 rounded-lg"
																	style={{
																		backgroundColor: "var(--paper-raised)",
																		color: "var(--ink)",
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
									</section>
								))}
							</div>
						</section>
					) : (
						<section
							aria-labelledby="full-sequence-empty-heading"
							className="ink-block p-5"
						>
							<h2
								id="full-sequence-empty-heading"
								className="font-semibold mb-2 flex items-center gap-2"
								style={{ color: "var(--ink)" }}
							>
								<BookOpen size={16} aria-hidden="true" />
								{t("sequence_detail.full_sequence")}
							</h2>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--ink-soft)" }}
							>
								{tr(
									"sequence_detail.no_poses_assigned",
									"This sequence has no poses assigned yet in the backend data.",
								)}
							</p>
						</section>
					)}
				</div>
			)}
		</main>
	);
}

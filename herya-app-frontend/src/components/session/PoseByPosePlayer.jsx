import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Pause,
	Play,
	RotateCcw,
	PersonStanding,
	Eye,
	EyeOff,
	AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const TABS = ["alignment", "breathing", "mistakes", "benefits"];

export default function PoseByPosePlayer({
	sequence,
	level = "beginner",
	guided = true,
	autoAdvance = true,
	onComplete,
	onPoseChange,
}) {
	const { t } = useLanguage();
	const [poseIndex, setPoseIndex] = useState(0);
	const [side, setSide] = useState(null); // null | "left" | "right"
	const [breathCount, setBreathCount] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [showGuide, setShowGuide] = useState(guided);
	const [activeTab, setActiveTab] = useState("alignment");
	const intervalRef = useRef(null);

	const corePoses = sequence?.structure?.corePoses || [];
	const currentCorePose = corePoses[poseIndex];
	const pose = currentCorePose?.pose;

	// Calculate target breaths for this pose & level
	const getTargetBreaths = useCallback(() => {
		if (!pose) return 5;
		const levelBreaths = pose.recommendedBreaths?.[level];
		if (levelBreaths) {
			return Math.round((levelBreaths.min + levelBreaths.max) / 2);
		}
		return currentCorePose?.breaths || 5;
	}, [pose, level, currentCorePose]);

	const targetBreaths = getTargetBreaths();
	const isAsymmetric =
		pose?.sidedness?.type === "both_sides";

	// Determine if we need to do a second side
	const needsSecondSide = isAsymmetric && side === "left";

	// Timer: count breaths (~4s per breath)
	useEffect(() => {
		if (!isRunning) {
			clearInterval(intervalRef.current);
			return;
		}
		intervalRef.current = setInterval(() => {
			setBreathCount((prev) => {
				const next = prev + 1;
				if (next >= targetBreaths && autoAdvance) {
					// Auto-advance after reaching target
					setTimeout(() => advancePose(), 300);
					return prev;
				}
				return next;
			});
		}, 4000); // ~4 seconds per breath
		return () => clearInterval(intervalRef.current);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRunning, targetBreaths, autoAdvance]);

	const advancePose = useCallback(() => {
		// If asymmetric and on left side, switch to right
		if (isAsymmetric && side === "left") {
			setSide("right");
			setBreathCount(0);
			return;
		}

		// Move to next pose
		if (poseIndex < corePoses.length - 1) {
			const nextPose = corePoses[poseIndex + 1]?.pose;
			const nextIsAsymmetric =
				nextPose?.sidedness?.type === "both_sides";
			setPoseIndex((i) => i + 1);
			setSide(nextIsAsymmetric ? "left" : null);
			setBreathCount(0);
			onPoseChange?.(poseIndex + 1);
		} else {
			// Sequence complete
			setIsRunning(false);
			onComplete?.();
		}
	}, [isAsymmetric, side, poseIndex, corePoses, onPoseChange, onComplete]);

	const goToPose = useCallback(
		(idx) => {
			if (idx < 0 || idx >= corePoses.length) return;
			const nextPose = corePoses[idx]?.pose;
			const nextIsAsymmetric =
				nextPose?.sidedness?.type === "both_sides";
			setPoseIndex(idx);
			setSide(nextIsAsymmetric ? "left" : null);
			setBreathCount(0);
			onPoseChange?.(idx);
		},
		[corePoses, onPoseChange],
	);

	const handleStart = () => {
		if (poseIndex === 0 && breathCount === 0 && isAsymmetric) {
			setSide("left");
		} else if (poseIndex === 0 && breathCount === 0 && !isAsymmetric) {
			setSide(null);
		}
		setIsRunning(true);
	};

	if (!sequence || corePoses.length === 0) {
		return (
			<div className="text-center py-8">
				<PersonStanding
					size={32}
					style={{ color: "var(--color-text-muted)" }}
					className="mx-auto mb-2"
				/>
				<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
					{t("guided.no_poses_data")}
				</p>
			</div>
		);
	}

	if (!pose) {
		goToPose(Math.min(poseIndex + 1, corePoses.length - 1));
		return null;
	}

	const poseName = pose.romanizationName || pose.name || "—";
	const breathProgress = Math.min(breathCount / targetBreaths, 1);

	return (
		<div className="flex flex-col gap-4">
			{/* Pose dots */}
			<div className="flex justify-center gap-1.5 flex-wrap" role="tablist">
				{corePoses.map((cp, idx) => (
					<button
						key={cp._id || idx}
						type="button"
						role="tab"
						aria-selected={idx === poseIndex}
						aria-label={`${t("guided.pose")} ${idx + 1}`}
						onClick={() => goToPose(idx)}
						className="rounded-full transition-all"
						style={{
							width: idx === poseIndex ? 20 : 8,
							height: 8,
							backgroundColor:
								idx < poseIndex
									? "var(--color-primary)"
									: idx === poseIndex
										? "var(--color-primary)"
										: "var(--color-border-soft)",
							opacity: idx <= poseIndex ? 1 : 0.4,
						}}
					/>
				))}
			</div>

			{/* Pose card */}
			<AnimatePresence mode="wait">
				<motion.div
					key={`${poseIndex}-${side}`}
					initial={{ opacity: 0, x: 40 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -40 }}
					transition={{ duration: 0.25 }}
					className="rounded-2xl overflow-hidden"
					style={{
						backgroundColor: "var(--color-surface-card)",
						border: "1px solid var(--color-border-soft)",
					}}
				>
					{/* Media */}
					<div
						className="relative aspect-square max-h-56 w-full flex items-center justify-center"
						style={{ backgroundColor: "var(--color-primary-light, #EEF2FF)" }}
					>
						{pose.media?.thumbnail?.url ? (
							<img
								src={pose.media.thumbnail.url}
								alt={poseName}
								className="w-full h-full object-contain"
								loading="lazy"
							/>
						) : (
							<PersonStanding
								size={72}
								strokeWidth={1.5}
								style={{ color: "var(--color-primary)", opacity: 0.4 }}
							/>
						)}

						{/* Side badge */}
						{side && (
							<span
								className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
								style={{
									backgroundColor: "var(--color-primary)",
									color: "white",
								}}
							>
								{side === "left"
									? t("guided.side_left")
									: t("guided.side_right")}
							</span>
						)}

						{/* Pose counter */}
						<span
							className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full"
							style={{
								backgroundColor: "rgba(0,0,0,0.5)",
								color: "white",
							}}
						>
							{poseIndex + 1}/{corePoses.length}
						</span>
					</div>

					{/* Names */}
					<div className="px-4 pt-3 pb-2 text-center">
						{pose.sanskritName && (
							<p
								className="text-sm"
								style={{
									color: "var(--color-text-muted)",
									fontFamily: "serif",
								}}
							>
								{pose.sanskritName}
							</p>
						)}
						<h3
							className="text-lg font-semibold"
							style={{
								fontFamily: '"DM Sans", sans-serif',
								color: "var(--color-text-primary)",
							}}
						>
							{poseName}
						</h3>
						{pose.name && pose.name !== poseName && (
							<p
								className="text-xs"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{pose.name}
							</p>
						)}

						{/* Drishti */}
						{pose.drishti && pose.drishti !== "none" && (
							<p
								className="text-xs mt-1"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("guided.drishti")}: {pose.drishti.replace(/_/g, " ")}
							</p>
						)}
					</div>

					{/* Breath progress */}
					<div className="px-4 pb-3">
						<div className="flex items-center justify-between mb-1">
							<span
								className="text-xs font-medium"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{pose.breathingCue || t("guided.breathe_steadily")}
							</span>
							<span
								className="text-xs font-bold"
								style={{ color: "var(--color-primary)" }}
							>
								{breathCount}/{targetBreaths}
							</span>
						</div>
						<div
							className="w-full h-2 rounded-full overflow-hidden"
							style={{ backgroundColor: "var(--color-border-soft)" }}
							role="progressbar"
							aria-valuenow={breathCount}
							aria-valuemax={targetBreaths}
						>
							<motion.div
								className="h-full rounded-full"
								style={{ backgroundColor: "var(--color-primary)" }}
								animate={{ width: `${breathProgress * 100}%` }}
								transition={{ duration: 0.3 }}
							/>
						</div>
					</div>

					{/* Guided info toggle */}
					{guided && (
						<div className="px-4 pb-3">
							<button
								type="button"
								onClick={() => setShowGuide((g) => !g)}
								className="flex items-center gap-1.5 text-xs font-medium"
								style={{ color: "var(--color-primary)" }}
							>
								{showGuide ? <EyeOff size={12} /> : <Eye size={12} />}
								{showGuide
									? t("guided.hide_instructions")
									: t("guided.show_instructions")}
							</button>
						</div>
					)}

					{/* Guided detail panel */}
					<AnimatePresence>
						{showGuide && guided && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className="overflow-hidden"
							>
								<PoseDetailPanel
									pose={pose}
									corePose={currentCorePose}
									activeTab={activeTab}
									setActiveTab={setActiveTab}
									t={t}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</AnimatePresence>

			{/* Controls */}
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => goToPose(poseIndex - 1)}
					disabled={poseIndex === 0 && side !== "right"}
					className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: "var(--color-border-soft)",
						color: "var(--color-text-secondary)",
					}}
					aria-label={t("guided.prev_pose")}
				>
					<ChevronLeft size={18} />
				</button>

				<motion.button
					whileTap={{ scale: 0.92 }}
					onClick={isRunning ? () => setIsRunning(false) : handleStart}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
					style={{ backgroundColor: "var(--color-primary)" }}
					aria-label={isRunning ? t("guided.pause") : t("guided.play")}
				>
					{isRunning ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
				</motion.button>

				<button
					type="button"
					onClick={() => {
						if (needsSecondSide) {
							setSide("right");
							setBreathCount(0);
						} else {
							advancePose();
						}
					}}
					disabled={poseIndex >= corePoses.length - 1 && !needsSecondSide}
					className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: "var(--color-border-soft)",
						color: "var(--color-text-secondary)",
					}}
					aria-label={t("guided.next_pose")}
				>
					<ChevronRight size={18} />
				</button>
			</div>

			{/* Repeat button */}
			<div className="flex justify-center">
				<button
					type="button"
					onClick={() => setBreathCount(0)}
					className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
					style={{
						color: "var(--color-text-secondary)",
						backgroundColor: "var(--color-surface)",
					}}
				>
					<RotateCcw size={12} />
					{t("guided.repeat_pose")}
				</button>
			</div>
		</div>
	);
}

function PoseDetailPanel({ pose, corePose, activeTab, setActiveTab, t }) {
	const alignmentPoints = pose.alignmentDetails?.keyPoints || [];
	const mistakes = pose.commonMistakes || [];
	const benefits = pose.benefits || [];
	const contraindications = pose.contraindications || [];
	const cues = corePose?.contextualCues || [];
	const instructions = pose.instructions || {};

	return (
		<div
			className="border-t"
			style={{ borderColor: "var(--color-border-soft)" }}
		>
			{/* Tabs */}
			<div
				className="flex gap-0.5 px-3 pt-2 overflow-x-auto"
				role="tablist"
			>
				{TABS.map((tab) => (
					<button
						key={tab}
						type="button"
						role="tab"
						aria-selected={activeTab === tab}
						onClick={() => setActiveTab(tab)}
						className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition"
						style={{
							backgroundColor:
								activeTab === tab
									? "var(--color-primary)"
									: "transparent",
							color:
								activeTab === tab
									? "white"
									: "var(--color-text-muted)",
						}}
					>
						{t(`guided.tab_${tab}`)}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="px-4 py-3 min-h-[80px]">
				{activeTab === "alignment" && (
					<div className="flex flex-col gap-2">
						{alignmentPoints.length > 0 ? (
							alignmentPoints.map((kp, i) => (
								<div key={i}>
									<p
										className="text-xs font-semibold capitalize"
										style={{ color: "var(--color-text-primary)" }}
									>
										{kp.area}
									</p>
									<p
										className="text-xs"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{kp.instruction}
									</p>
									{kp.commonMistake && (
										<p
											className="text-[10px] mt-0.5 flex items-center gap-1"
											style={{ color: "var(--color-danger, #EF4444)" }}
										>
											<AlertTriangle size={10} />
											{kp.commonMistake}
										</p>
									)}
								</div>
							))
						) : instructions.alignment?.length > 0 ? (
							instructions.alignment.map((inst, i) => (
								<p
									key={i}
									className="text-xs"
									style={{ color: "var(--color-text-secondary)" }}
								>
									• {inst}
								</p>
							))
						) : (
							<p
								className="text-xs"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("guided.no_alignment_data")}
							</p>
						)}
						{cues.length > 0 && (
							<div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
								<p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
									{t("guided.teaching_cues")}
								</p>
								{cues.map((c, i) => (
									<p key={i} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
										• {c}
									</p>
								))}
							</div>
						)}
						{pose.alignmentDetails?.activeBandhas?.length > 0 && (
							<p
								className="text-xs mt-1"
								style={{ color: "var(--color-primary)" }}
							>
								Bandhas: {pose.alignmentDetails.activeBandhas.join(", ")}
							</p>
						)}
					</div>
				)}

				{activeTab === "breathing" && (
					<div className="flex flex-col gap-2">
						<p
							className="text-sm font-medium"
							style={{ color: "var(--color-text-primary)" }}
						>
							{pose.breathingCue || t("guided.breathe_steadily")}
						</p>
						{instructions.setup?.length > 0 && (
							<div>
								<p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
									{t("guided.setup")}
								</p>
								{instructions.setup.map((s, i) => (
									<p key={i} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
										{i + 1}. {s}
									</p>
								))}
							</div>
						)}
						{instructions.exit?.length > 0 && (
							<div>
								<p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--color-text-muted)" }}>
									{t("guided.exit_pose")}
								</p>
								{instructions.exit.map((s, i) => (
									<p key={i} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
										{i + 1}. {s}
									</p>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "mistakes" && (
					<div className="flex flex-col gap-1.5">
						{mistakes.length > 0 ? (
							mistakes.map((m, i) => (
								<div key={i} className="flex items-start gap-1.5">
									<AlertTriangle
										size={12}
										className="shrink-0 mt-0.5"
										style={{ color: "var(--color-danger, #EF4444)" }}
									/>
									<p
										className="text-xs"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{m}
									</p>
								</div>
							))
						) : (
							<p
								className="text-xs"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("guided.no_mistakes_data")}
							</p>
						)}
						{contraindications.length > 0 && (
							<div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--color-border-soft)" }}>
								<p className="text-[10px] font-semibold uppercase mb-1" style={{ color: "var(--color-warning-text, #92400E)" }}>
									{t("guided.contraindications")}
								</p>
								{contraindications.map((c, i) => (
									<p key={i} className="text-xs" style={{ color: "var(--color-warning-text, #92400E)" }}>
										• {c}
									</p>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "benefits" && (
					<div className="flex flex-col gap-1">
						{benefits.length > 0 ? (
							benefits.map((b, i) => (
								<p
									key={i}
									className="text-xs"
									style={{ color: "var(--color-text-secondary)" }}
								>
									• {b}
								</p>
							))
						) : (
							<p
								className="text-xs"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("guided.no_benefits_data")}
							</p>
						)}
						{pose.targetMuscles?.length > 0 && (
							<p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
								{t("guided.target_muscles")}: {pose.targetMuscles.join(", ")}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

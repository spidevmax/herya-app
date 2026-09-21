import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowLeftRight,
	ChevronLeft,
	ChevronRight,
	Eye,
	EyeOff,
	Pause,
	PersonStanding,
	Play,
	RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";
import {
	distributePoseTime,
	formatPoseDuration,
} from "@/utils/distributePoseTime";
import {
	localized,
	localizedArray,
	localizedName,
	translateWithFallback,
} from "@/utils/libraryHelpers";

const TABS = ["alignment", "breathing", "mistakes", "benefits"];

const PoseByPosePlayer = ({
	sequence,
	level = "beginner",
	guided = true,
	lowStimMode = false,
	autoAdvance = true,
	blockDurationSec = 0,
	distributionMode = "auto",
	manualOverrides = {},
	onComplete,
	onPoseChange,
}) => {
	const { t, lang } = useLanguage();
	const [poseIndex, setPoseIndex] = useState(0);
	const [side, setSide] = useState(null); // null | "left" | "right"
	const [elapsedSec, setElapsedSec] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [showGuide, setShowGuide] = useState(guided && !lowStimMode);
	const [activeTab, setActiveTab] = useState("alignment");
	const intervalRef = useRef(null);
	const lastTickRef = useRef(null);

	const corePoses = sequence?.structure?.corePoses || [];
	const currentCorePose = corePoses[poseIndex];
	const pose = currentCorePose?.pose;

	// Compute time distribution for all poses
	const distribution = useMemo(() => {
		if (!corePoses.length) return null;
		const effectiveDuration =
			blockDurationSec > 0
				? blockDurationSec
				: corePoses.length *
					20 *
					(corePoses.some((cp) => cp?.pose?.sidedness?.type === "both_sides")
						? 2
						: 1);
		return distributePoseTime({
			corePoses,
			blockTotalSec: effectiveDuration,
			level,
			mode: distributionMode,
			manualOverrides,
		});
	}, [corePoses, blockDurationSec, level, distributionMode, manualOverrides]);

	const currentPoseAlloc = distribution?.poses?.[poseIndex];
	const targetSec = currentPoseAlloc
		? side
			? currentPoseAlloc.perSideSec
			: currentPoseAlloc.totalSec
		: 20;
	const targetBreaths = currentPoseAlloc?.breaths || 5;
	const isAsymmetric = pose?.sidedness?.type === "both_sides";

	// Determine if we need to do a second side
	const needsSecondSide = isAsymmetric && side === "left";

	const advancePose = useCallback(() => {
		// If asymmetric and on left side, switch to right
		if (isAsymmetric && side === "left") {
			setSide("right");
			setElapsedSec(0);
			return;
		}

		// Move to next pose
		if (poseIndex < corePoses.length - 1) {
			const nextPose = corePoses[poseIndex + 1]?.pose;
			const nextIsAsymmetric = nextPose?.sidedness?.type === "both_sides";
			setPoseIndex((i) => i + 1);
			setSide(nextIsAsymmetric ? "left" : null);
			setElapsedSec(0);
			onPoseChange?.(poseIndex + 1);
		} else {
			// Sequence complete
			setIsRunning(false);
			onComplete?.();
		}
	}, [isAsymmetric, side, poseIndex, corePoses, onPoseChange, onComplete]);

	// Timer: count elapsed seconds (drift-free)
	useEffect(() => {
		if (!isRunning) {
			clearInterval(intervalRef.current);
			lastTickRef.current = null;
			return;
		}
		lastTickRef.current = Date.now();
		intervalRef.current = setInterval(() => {
			const now = Date.now();
			const delta = Math.min((now - (lastTickRef.current || now)) / 1000, 2);
			lastTickRef.current = now;
			setElapsedSec((prev) => {
				const next = prev + delta;
				if (next >= targetSec && autoAdvance) {
					setTimeout(() => advancePose(), 300);
					return prev;
				}
				return next;
			});
		}, 250);
		return () => clearInterval(intervalRef.current);
	}, [isRunning, targetSec, autoAdvance, advancePose]);

	const goToPose = useCallback(
		(idx) => {
			if (idx < 0 || idx >= corePoses.length) return;
			const nextPose = corePoses[idx]?.pose;
			const nextIsAsymmetric = nextPose?.sidedness?.type === "both_sides";
			setPoseIndex(idx);
			setSide(nextIsAsymmetric ? "left" : null);
			setElapsedSec(0);
			onPoseChange?.(idx);
		},
		[corePoses, onPoseChange],
	);

	const handleStart = () => {
		if (poseIndex === 0 && elapsedSec === 0 && isAsymmetric) {
			setSide("left");
		} else if (poseIndex === 0 && elapsedSec === 0 && !isAsymmetric) {
			setSide(null);
		}
		setIsRunning(true);
	};

	if (!sequence || corePoses.length === 0) {
		return (
			<section className="text-center py-8" aria-live="polite">
				<PersonStanding
					size={32}
					aria-hidden="true"
					style={{ color: "var(--ink-soft)" }}
					className="mx-auto mb-2"
				/>
				<p className="text-sm" style={{ color: "var(--ink-soft)" }}>
					{t("guided.no_poses_data")}
				</p>
			</section>
		);
	}

	if (!pose) {
		goToPose(Math.min(poseIndex + 1, corePoses.length - 1));
		return null;
	}

	const poseName =
		localizedName(pose, lang) || pose.romanizationName || pose.name || "—";
	const timeProgress = Math.min(elapsedSec / targetSec, 1);
	const remainingSec = Math.max(0, Math.ceil(targetSec - elapsedSec));

	return (
		<section aria-label={t("guided.pose")} className="flex flex-col gap-4">
			{/* Pose dots */}
			<nav
				aria-label={t("guided.pose")}
				className="flex justify-center gap-1.5 flex-wrap"
			>
				{corePoses.map((cp, idx) => (
					<button
						key={cp._id || idx}
						type="button"
						aria-current={idx === poseIndex ? "step" : undefined}
						aria-label={`${t("guided.pose")} ${idx + 1}`}
						onClick={() => goToPose(idx)}
						className="rounded-full transition-all"
						style={{
							width: idx === poseIndex ? 20 : 8,
							height: 8,
							backgroundColor:
								idx < poseIndex
									? "var(--chandra)"
									: idx === poseIndex
										? "var(--chandra)"
										: "var(--ink)",
							opacity: idx <= poseIndex ? 1 : 0.4,
						}}
					/>
				))}
			</nav>

			{/* Pose card */}
			<AnimatePresence mode="wait">
				<motion.article
					key={`${poseIndex}-${side}`}
					aria-label={pose?.romanizationName || pose?.name || t("guided.pose")}
					initial={{ opacity: 0, x: lowStimMode ? 0 : 40 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: lowStimMode ? 0 : -40 }}
					transition={{ duration: lowStimMode ? 0.15 : 0.25 }}
					className="rounded-2xl overflow-hidden"
					style={{
						backgroundColor: "var(--paper-raised)",
						border: "var(--ink-width) solid var(--ink)",
					}}
				>
					{/* Media */}
					<figure
						className="relative aspect-square max-h-56 w-full flex items-center justify-center m-0"
						style={{ backgroundColor: "var(--paper-raised)" }}
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
								style={{ color: "var(--chandra)", opacity: 0.4 }}
							/>
						)}

						{/* Side badge */}
						{side && (
							<span
								className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
								style={{
									backgroundColor: "var(--chandra)",
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
								backgroundColor: "rgba(27, 30, 60, 0.72)",
								color: "white",
							}}
						>
							{poseIndex + 1}/{corePoses.length}
						</span>
					</figure>

					{/* Names */}
					<div className="px-4 pt-3 pb-2 text-center">
						{pose.sanskritName && (
							<p
								className="text-sm"
								style={{
									color: "var(--ink-soft)",
									fontFamily: "serif",
								}}
							>
								{pose.sanskritName}
							</p>
						)}
						<h3 className="text-lg font-semibold text-[var(--ink)]">
							{poseName}
						</h3>
						{/*
						 * Bajo el nombre traducido va la romanizacion del sanscrito
						 * ("Prasarita Padottanasana"), que es la misma en los dos
						 * idiomas y hace juego con el devanagari de arriba. Antes aqui
						 * se pintaba pose.name, que es el nombre en ingles, asi que en
						 * espanol se colaba una linea en ingles.
						 */}
						{pose.romanizationName && pose.romanizationName !== poseName && (
							<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
								{pose.romanizationName}
							</p>
						)}

						{/* Drishti */}
						{pose.drishti && pose.drishti !== "none" && (
							<p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
								{t("guided.drishti")}: {pose.drishti.replace(/_/g, " ")}
							</p>
						)}
					</div>

					{/* Time + breath progress */}
					<div className="px-4 pb-3">
						<div className="flex items-center justify-between mb-1">
							<span
								className="text-xs font-medium"
								style={{ color: "var(--ink-soft)" }}
							>
								{localized(pose, "breathingCue", lang) ||
									t("guided.breathe_steadily")}
							</span>
							<div className="flex items-center gap-2">
								{currentPoseAlloc?.bilateral && side && (
									<span
										className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
										style={{
											backgroundColor: "var(--paper-raised)",
											color: "var(--chandra)",
										}}
									>
										<ArrowLeftRight size={9} />
										{side === "left"
											? t("guided.side_left")
											: t("guided.side_right")}
									</span>
								)}
								<span
									className="text-xs font-bold tabular-nums"
									style={{ color: "var(--chandra)" }}
								>
									{formatPoseDuration(remainingSec)}
								</span>
							</div>
						</div>
						<div
							className="w-full h-2 rounded-full overflow-hidden"
							style={{ backgroundColor: "var(--ink)" }}
							role="progressbar"
							aria-valuenow={Math.round(elapsedSec)}
							aria-valuemax={targetSec}
							aria-label={`${formatPoseDuration(remainingSec)} ${t("practice.remaining")}`}
						>
							<motion.div
								className="h-full rounded-full"
								style={{ backgroundColor: "var(--chandra)" }}
								animate={{ width: `${timeProgress * 100}%` }}
								transition={{ duration: 0.3 }}
							/>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span
								className="text-[10px]"
								style={{ color: "var(--ink-soft)" }}
							>
								{t("guided.breaths")}: ~{targetBreaths}
							</span>
							<span
								className="text-[10px]"
								style={{ color: "var(--ink-soft)" }}
							>
								{formatPoseDuration(Math.round(elapsedSec))} /{" "}
								{formatPoseDuration(targetSec)}
							</span>
						</div>
					</div>

					{/* Guided info toggle */}
					{guided && (
						<div className="px-4 pb-3">
							<button
								type="button"
								onClick={() => setShowGuide((g) => !g)}
								className="flex items-center gap-1.5 text-xs font-medium"
								style={{ color: "var(--chandra)" }}
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
									lang={lang}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</motion.article>
			</AnimatePresence>

			{/* Controls */}
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => goToPose(poseIndex - 1)}
					disabled={poseIndex === 0 && side !== "right"}
					className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
					style={{
						backgroundColor: "var(--paper-raised)",
						borderColor: "var(--ink)",
						color: "var(--ink-soft)",
					}}
					aria-label={t("guided.prev_pose")}
				>
					<ChevronLeft size={18} aria-hidden="true" />
				</button>

				<motion.button
					type="button"
					whileTap={{ scale: 0.92 }}
					onClick={isRunning ? () => setIsRunning(false) : handleStart}
					aria-pressed={isRunning}
					className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
					style={{ backgroundColor: "var(--chandra)" }}
					aria-label={isRunning ? t("guided.pause") : t("guided.play")}
				>
					{isRunning ? (
						<Pause size={24} aria-hidden="true" />
					) : (
						<Play size={24} aria-hidden="true" className="ml-0.5" />
					)}
				</motion.button>

				<button
					type="button"
					onClick={() => {
						if (needsSecondSide) {
							setSide("right");
							setElapsedSec(0);
						} else {
							advancePose();
						}
					}}
					disabled={poseIndex >= corePoses.length - 1 && !needsSecondSide}
					className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
					style={{
						backgroundColor: "var(--paper-raised)",
						borderColor: "var(--ink)",
						color: "var(--ink-soft)",
					}}
					aria-label={t("guided.next_pose")}
				>
					<ChevronRight size={18} aria-hidden="true" />
				</button>
			</div>

			{/* Repeat button */}
			<div className="flex justify-center">
				<button
					type="button"
					onClick={() => setElapsedSec(0)}
					className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
					style={{
						color: "var(--ink-soft)",
						backgroundColor: "var(--paper)",
					}}
				>
					<RotateCcw size={12} aria-hidden="true" />
					{t("guided.repeat_pose")}
				</button>
			</div>
		</section>
	);
};

const PoseDetailPanel = ({
	pose,
	corePose,
	activeTab,
	setActiveTab,
	t,
	lang,
}) => {
	const alignmentPoints = pose.alignmentDetails?.keyPoints || [];
	const mistakes =
		localizedArray(pose, "commonMistakes", lang).length > 0
			? localizedArray(pose, "commonMistakes", lang)
			: pose.commonMistakes || [];
	const benefits =
		localizedArray(pose, "benefits", lang).length > 0
			? localizedArray(pose, "benefits", lang)
			: pose.benefits || [];
	const contraindications =
		localizedArray(pose, "contraindications", lang).length > 0
			? localizedArray(pose, "contraindications", lang)
			: pose.contraindications || [];
	const cues = corePose?.contextualCues || [];
	const instructions = pose.instructions || {};

	return (
		<section
			aria-label={t("guided.tab_alignment")}
			className="border-t"
			style={{ borderColor: "var(--ink)" }}
		>
			{/* Tabs */}
			{/*
			 * py-2 en lugar de pt-2: el anillo de foco del teclado sobresale 5px
			 * por fuera del boton (2px de borde mas 3px de separacion). Como la
			 * fila lleva overflow-x-auto y el navegador no permite recortar solo
			 * en horizontal, sin hueco abajo el anillo se cortaba por la mitad.
			 */}
			<div className="flex gap-0.5 px-3 py-2 overflow-x-auto" role="tablist">
				{TABS.map((tab) => (
					<button
						key={tab}
						type="button"
						role="tab"
						id={`pose-tab-${tab}`}
						aria-controls={`pose-tabpanel-${tab}`}
						aria-selected={activeTab === tab}
						onClick={() => setActiveTab(tab)}
						className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition"
						style={{
							backgroundColor:
								activeTab === tab ? "var(--chandra)" : "transparent",
							color: activeTab === tab ? "white" : "var(--ink-soft)",
						}}
					>
						{t(`guided.tab_${tab}`)}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div
				role="tabpanel"
				id={`pose-tabpanel-${activeTab}`}
				aria-labelledby={`pose-tab-${activeTab}`}
				className="px-4 py-3 min-h-[80px]"
			>
				{activeTab === "alignment" && (
					<div className="flex flex-col gap-2">
						{alignmentPoints.length > 0 ? (
							alignmentPoints.map((kp) => (
								<div key={kp.area || kp.instruction}>
									<p
										className="text-xs font-semibold capitalize"
										style={{ color: "var(--ink)" }}
									>
										{/* La zona es un valor fijo en ingles ("spine"),
										    con su traduccion en anatomy.* */}
										{translateWithFallback(t, `anatomy.${kp.area}`, kp.area)}
									</p>
									<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
										{localized(kp, "instruction", lang)}
									</p>
									{kp.commonMistake && (
										<p
											className="text-[10px] mt-0.5 flex items-center gap-1"
											style={{ color: "var(--alert)" }}
										>
											<AlertTriangle size={10} />
											{localized(kp, "commonMistake", lang)}
										</p>
									)}
								</div>
							))
						) : instructions.alignment?.length > 0 ? (
							instructions.alignment.map((inst) => (
								<p
									key={inst}
									className="text-xs"
									style={{ color: "var(--ink-soft)" }}
								>
									• {inst}
								</p>
							))
						) : (
							<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
								{t("guided.no_alignment_data")}
							</p>
						)}
						{cues.length > 0 && (
							<div
								className="mt-2 pt-2 border-t"
								style={{ borderColor: "var(--ink)" }}
							>
								<p
									className="text-[10px] font-semibold uppercase mb-1"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("guided.teaching_cues")}
								</p>
								{cues.map((c) => (
									<p
										key={c}
										className="text-xs"
										style={{ color: "var(--ink-soft)" }}
									>
										• {c}
									</p>
								))}
							</div>
						)}
						{pose.alignmentDetails?.activeBandhas?.length > 0 && (
							<p className="text-xs mt-1" style={{ color: "var(--chandra)" }}>
								Bandhas: {pose.alignmentDetails.activeBandhas.join(", ")}
							</p>
						)}
					</div>
				)}

				{activeTab === "breathing" && (
					<div className="flex flex-col gap-2">
						<p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
							{localized(pose, "breathingCue", lang) ||
								t("guided.breathe_steadily")}
						</p>
						{instructions.setup?.length > 0 && (
							<div>
								<p
									className="text-[10px] font-semibold uppercase mb-1"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("guided.setup")}
								</p>
								{instructions.setup.map((s, idx) => (
									<p
										key={s}
										className="text-xs"
										style={{ color: "var(--ink-soft)" }}
									>
										{idx + 1}. {s}
									</p>
								))}
							</div>
						)}
						{instructions.exit?.length > 0 && (
							<div>
								<p
									className="text-[10px] font-semibold uppercase mb-1"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("guided.exit_pose")}
								</p>
								{instructions.exit.map((s, idx) => (
									<p
										key={s}
										className="text-xs"
										style={{ color: "var(--ink-soft)" }}
									>
										{idx + 1}. {s}
									</p>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === "mistakes" && (
					<div className="flex flex-col gap-1.5">
						{mistakes.length > 0 ? (
							mistakes.map((m) => (
								<div key={m} className="flex items-start gap-1.5">
									<AlertTriangle
										size={12}
										className="shrink-0 mt-0.5"
										style={{ color: "var(--alert)" }}
									/>
									<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
										{m}
									</p>
								</div>
							))
						) : (
							<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
								{t("guided.no_mistakes_data")}
							</p>
						)}
						{contraindications.length > 0 && (
							<div
								className="mt-2 pt-2 border-t"
								style={{ borderColor: "var(--ink)" }}
							>
								<p
									className="text-[10px] font-semibold uppercase mb-1"
									style={{ color: "var(--ink)" }}
								>
									{t("guided.contraindications")}
								</p>
								{contraindications.map((c) => (
									<p
										key={c}
										className="text-xs"
										style={{ color: "var(--ink)" }}
									>
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
							benefits.map((b) => (
								<p
									key={b}
									className="text-xs"
									style={{ color: "var(--ink-soft)" }}
								>
									• {b}
								</p>
							))
						) : (
							<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
								{t("guided.no_benefits_data")}
							</p>
						)}
						{pose.targetMuscles?.length > 0 && (
							<p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
								{t("guided.target_muscles")}: {/*
								 * targetMuscles llega de la base de datos en ingles
								 * ("hamstrings"). Las traducciones viven bajo anatomy.*,
								 * asi que se traduce cada musculo por separado antes de
								 * unirlos. Si alguno no tiene traduccion se queda con su
								 * nombre original en lugar de mostrar la clave.
								 */}
								{pose.targetMuscles
									.map((muscle) =>
										translateWithFallback(t, `anatomy.${muscle}`, muscle),
									)
									.join(", ")}
							</p>
						)}
					</div>
				)}
			</div>
		</section>
	);
};

export default PoseByPosePlayer;

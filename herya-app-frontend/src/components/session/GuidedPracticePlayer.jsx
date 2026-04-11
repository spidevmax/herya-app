import { useEffect, useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Play,
	Pause,
	SkipForward,
	SkipBack,
	Square,
	ChevronRight,
	Leaf,
	PersonStanding,
	Wind,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button, ProgressBar, CircleProgress, ConfirmModal } from "@/components/ui";
import useSessionTimer from "@/hooks/useSessionTimer";
import PoseByPosePlayer from "./PoseByPosePlayer";
import CycleBreathingPlayer from "./CycleBreathingPlayer";
import PhasedMeditationPlayer from "./PhasedMeditationPlayer";

const formatTime = (totalSec) => {
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const BLOCK_TYPE_COLORS = {
	vk_sequence: "var(--color-primary)",
	pranayama: "var(--color-secondary)",
	meditation: "var(--color-accent)",
};

const BLOCK_TYPE_ICONS = {
	vk_sequence: PersonStanding,
	pranayama: Wind,
	meditation: Leaf,
};

export default function GuidedPracticePlayer({
	blocks,
	sequencesData = {},
	patternsData = {},
	lowStimMode = false,
	isTutorMode = false,
	safetyAnchors,
	onComplete,
	onAbandon,
	onSaveProgress,
	onTimerStart,
}) {
	const { t } = useLanguage();
	const timer = useSessionTimer(blocks);
	const [abandonModalOpen, setAbandonModalOpen] = useState(false);
	const [safePauseOpen, setSafePauseOpen] = useState(false);
	const [safePauseRemaining, setSafePauseRemaining] = useState(90);
	const [safePauseCount, setSafePauseCount] = useState(0);
	const [anchorUsed, setAnchorUsed] = useState(false);
	const anchorPhrase = (safetyAnchors?.phrase || "").trim();
	const anchorBodyCue = (safetyAnchors?.bodyCue || "").trim();
	const hasAnchors = Boolean(anchorPhrase || anchorBodyCue);
	const backendTimerStartedRef = useRef(false);
	const prevBlockRef = useRef(timer.currentBlockIndex);
	const blockChangeAudioRef = useRef(null);
	const plannedTotalSec = useRef(
		blocks.reduce(
			(sum, block) => sum + (Number(block.durationMinutes) || 0) * 60,
			0,
		),
	);

	const resolveElapsedSec = useCallback(() => {
		if (timer.globalElapsedSec > 0) return timer.globalElapsedSec;
		return plannedTotalSec.current;
	}, [timer.globalElapsedSec]);

	// Start the frontend timer AND notify the backend (once)
	const startTimerWithBackend = useCallback(() => {
		timer.start();
		if (!backendTimerStartedRef.current) {
			backendTimerStartedRef.current = true;
			onTimerStart?.();
		}
	}, [timer.start, onTimerStart]);

	// Persist progress periodically
	useEffect(() => {
		if (!timer.isRunning || !onSaveProgress) return;
		const id = setInterval(() => {
			onSaveProgress({
				currentBlockIndex: timer.currentBlockIndex,
				globalElapsedSec: timer.globalElapsedSec,
				isRunning: timer.isRunning,
			});
		}, 5000);
		return () => clearInterval(id);
	}, [
		timer.isRunning,
		timer.currentBlockIndex,
		timer.globalElapsedSec,
		onSaveProgress,
	]);

	// Play sound on block change
	useEffect(() => {
		if (lowStimMode) return;
		if (timer.currentBlockIndex !== prevBlockRef.current && timer.isRunning) {
			prevBlockRef.current = timer.currentBlockIndex;
			try {
				if (!blockChangeAudioRef.current) {
					const ctx = new AudioContext();
					blockChangeAudioRef.current = ctx;
				}
				const ctx = blockChangeAudioRef.current;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.frequency.value = 528;
				osc.type = "sine";
				gain.gain.setValueAtTime(0.15, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
				osc.start(ctx.currentTime);
				osc.stop(ctx.currentTime + 0.8);
			} catch {
				// Audio not available
			}
		}
	}, [timer.currentBlockIndex, timer.isRunning, lowStimMode]);

	const handleFinish = useCallback(() => {
		timer.pause();
		const elapsedSec = resolveElapsedSec();
		onComplete({
			blocksCompleted: timer.currentBlockIndex + 1,
			globalElapsedSec: elapsedSec,
			tutorSupport: {
				safePauseCount,
				anchorAvailable: hasAnchors,
				anchorUsed,
			},
		});
	}, [
		anchorUsed,
		hasAnchors,
		onComplete,
		resolveElapsedSec,
		safePauseCount,
		timer,
	]);

	const handleAbandon = () => {
		timer.pause();
		const elapsedSec = resolveElapsedSec();
		onAbandon({
			blocksCompleted: timer.currentBlockIndex,
			globalElapsedSec: elapsedSec,
			tutorSupport: {
				safePauseCount,
				anchorAvailable: hasAnchors,
				anchorUsed,
			},
		});
	};

	useEffect(() => {
		if (!safePauseOpen) return;
		if (safePauseRemaining <= 0) return;

		const id = setInterval(() => {
			setSafePauseRemaining((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(id);
	}, [safePauseOpen, safePauseRemaining]);

	const openSafePause = () => {
		timer.pause();
		setSafePauseRemaining(90);
		setSafePauseCount((prev) => prev + 1);
		setSafePauseOpen(true);
	};

	const closeSafePauseAndResume = () => {
		setSafePauseOpen(false);
		if (timer.globalElapsedSec > 0) {
			timer.resume();
		} else {
			startTimerWithBackend();
		}
	};

	// When a guided sub-player completes its block, advance
	const handleBlockPlayerComplete = useCallback(() => {
		if (timer.isLastBlock) {
			handleFinish();
		} else {
			timer.nextBlock();
		}
	}, [timer.isLastBlock, timer.nextBlock, handleFinish]);

	const currentBlock = timer.currentBlock;
	const nextBlock = blocks[timer.currentBlockIndex + 1] || null;
	const blockColor =
		BLOCK_TYPE_COLORS[currentBlock?.blockType] || "var(--color-primary)";
	const BlockIcon = BLOCK_TYPE_ICONS[currentBlock?.blockType] || PersonStanding;

	// Check if current block has guided sub-player content
	const isGuidedVK =
		currentBlock?.blockType === "vk_sequence" &&
		currentBlock?.guided &&
		currentBlock?.vkSequence &&
		sequencesData[currentBlock.vkSequence];

	const isGuidedPranayama =
		currentBlock?.blockType === "pranayama" &&
		currentBlock?.guided &&
		currentBlock?.breathingPattern &&
		patternsData[currentBlock.breathingPattern];

	const isGuidedMeditation =
		currentBlock?.blockType === "meditation" && currentBlock?.guided;

	const hasGuidedPlayer = isGuidedVK || isGuidedPranayama || isGuidedMeditation;

	// Whether the session has never been started (user hasn't pressed play yet)
	const isWaitingToStart = !timer.isRunning && timer.globalElapsedSec === 0;

	return (
		<div className="flex flex-col gap-5 pt-2 pb-4">
			{/* Global progress bar */}
			<div>
				<div className="flex justify-between items-center mb-1.5">
					<span
						className="text-xs font-medium"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("practice.session_progress")}
					</span>
					<span
						className="text-xs font-semibold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{formatTime(timer.globalElapsedSec)} /{" "}
						{formatTime(timer.totalPlannedSec)}
					</span>
				</div>
				<ProgressBar
					value={timer.globalElapsedSec}
					max={timer.totalPlannedSec}
					color="var(--color-primary)"
				/>
				<div className="flex justify-between mt-1">
					<span
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.time_elapsed")}: {formatTime(timer.globalElapsedSec)}
					</span>
					<span
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.time_remaining")}: {formatTime(timer.globalRemainingSec)}
					</span>
				</div>
			</div>

			{/* Block indicator dots */}
			<div className="flex justify-center gap-1.5">
				{blocks.map((block, idx) => (
					<button
						key={
							block.id ??
							block._id ??
							`block-${block.order ?? block.label ?? block.blockType}`
						}
						type="button"
						onClick={() => timer.goToBlock(idx)}
						className="transition-all rounded-full"
						style={{
							width: idx === timer.currentBlockIndex ? 24 : 8,
							height: 8,
							backgroundColor:
								idx < timer.currentBlockIndex
									? BLOCK_TYPE_COLORS[block.blockType]
									: idx === timer.currentBlockIndex
										? BLOCK_TYPE_COLORS[block.blockType]
										: "var(--color-border-soft)",
							opacity: idx <= timer.currentBlockIndex ? 1 : 0.4,
						}}
					/>
				))}
			</div>

			{/* Current block content */}
			<AnimatePresence mode="wait">
				{currentBlock && (
					<motion.div
						key={timer.currentBlockIndex}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
					>
						{/* Guided VK Player — only render when timer is running */}
						{isGuidedVK && !isWaitingToStart && (
							<PoseByPosePlayer
								sequence={sequencesData[currentBlock.vkSequence]}
								level={currentBlock.level || "beginner"}
								guided={currentBlock.guided && !lowStimMode}
								lowStimMode={lowStimMode}
								autoAdvance={currentBlock.config?.autoAdvancePoses !== false}
								blockDurationSec={(currentBlock.durationMinutes || 0) * 60}
								distributionMode={currentBlock.config?.distributionMode || "auto"}
								manualOverrides={currentBlock.config?.manualOverrides || {}}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Guided Pranayama Player — only render when timer is running */}
						{isGuidedPranayama && !isWaitingToStart && (
							<CycleBreathingPlayer
								pattern={patternsData[currentBlock.breathingPattern]}
								config={currentBlock.config || {}}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Guided Meditation Player — only render when timer is running */}
						{isGuidedMeditation && !isWaitingToStart && (
							<PhasedMeditationPlayer
								meditationType={currentBlock.meditationType || "guided"}
								durationMinutes={currentBlock.durationMinutes || 10}
								config={{
									...(currentBlock.config || {}),
									bellAtStart: lowStimMode
										? false
										: currentBlock.config?.bellAtStart,
									bellAtEnd: lowStimMode
										? false
										: currentBlock.config?.bellAtEnd,
									bellInterval: lowStimMode
										? 0
										: currentBlock.config?.bellInterval,
									lowStim: lowStimMode,
								}}
								guided={currentBlock.guided && !lowStimMode}
								lowStimMode={lowStimMode}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Start overlay — shown before user presses play (all block types) */}
						{isWaitingToStart && hasGuidedPlayer && (
							<div
								className="rounded-2xl p-6 text-center"
								style={{
									backgroundColor: "var(--color-surface-card)",
									border: `2px solid color-mix(in srgb, ${blockColor} 30%, transparent)`,
								}}
							>
								<p
									className="text-xs font-semibold uppercase tracking-widest mb-2"
									style={{ color: blockColor }}
								>
									{t("practice.block_label", {
										current: timer.currentBlockIndex + 1,
										total: blocks.length,
									})}
								</p>
								<div className="mb-3 flex justify-center">
									<BlockIcon
										size={44}
										strokeWidth={2.2}
										style={{ color: blockColor }}
									/>
								</div>
								<h3 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">
									{currentBlock.label}
								</h3>
								<p
									className="text-sm mb-5"
									style={{ color: "var(--color-text-secondary)" }}
								>
									{t(`practice.type_${currentBlock.blockType}`)} · {currentBlock.durationMinutes}m
								</p>
								<motion.button
									whileTap={{ scale: 0.92 }}
									onClick={startTimerWithBackend}
									aria-label={t("practice.aria_play")}
									className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg"
									style={{ backgroundColor: blockColor }}
								>
									<Play size={32} className="ml-1" />
								</motion.button>
								<p
									className="text-xs mt-3"
									style={{ color: "var(--color-text-muted)" }}
								>
									{t("practice.tap_to_start")}
								</p>
							</div>
						)}

						{/* Fallback: Timer-only card (non-guided or missing data) */}
						{!hasGuidedPlayer && (
							<div
								className="rounded-2xl p-6 text-center"
								style={{
									backgroundColor: "var(--color-surface-card)",
									border: `2px solid color-mix(in srgb, ${blockColor} 30%, transparent)`,
								}}
							>
								<p
									className="text-xs font-semibold uppercase tracking-widest mb-2"
									style={{ color: blockColor }}
								>
									{t("practice.block_label", {
										current: timer.currentBlockIndex + 1,
										total: blocks.length,
									})}
								</p>

								<div className="mb-3 flex justify-center">
									<BlockIcon
										size={44}
										strokeWidth={2.2}
										style={{ color: blockColor }}
									/>
								</div>

								<h3 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">
									{currentBlock.label}
								</h3>

								<p
									className="text-sm mb-4"
									style={{ color: "var(--color-text-secondary)" }}
								>
									{t(`practice.type_${currentBlock.blockType}`)}
								</p>

								{/* Block timer circle */}
								<div className="flex justify-center mb-4">
									<CircleProgress
										value={timer.blockElapsedSec}
										max={(currentBlock.durationMinutes || 1) * 60}
										size={120}
										stroke={8}
										color={blockColor}
									>
										<div className="text-center">
											<p
												className="text-2xl font-bold"
												style={{ color: "var(--color-text-primary)" }}
											>
												{formatTime(timer.blockRemainingSec)}
											</p>
											<p
												className="text-[10px] font-medium"
												style={{ color: "var(--color-text-muted)" }}
											>
												{t("practice.block_remaining")}
											</p>
										</div>
									</CircleProgress>
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Next block preview */}
			{nextBlock && (
				<div
					className="flex items-center gap-3 px-4 py-3 rounded-xl"
					style={{
						backgroundColor: `color-mix(in srgb, ${BLOCK_TYPE_COLORS[nextBlock.blockType]} 8%, transparent)`,
						border: `1px solid color-mix(in srgb, ${BLOCK_TYPE_COLORS[nextBlock.blockType]} 20%, transparent)`,
					}}
				>
					<ChevronRight
						size={14}
						style={{
							color: BLOCK_TYPE_COLORS[nextBlock.blockType],
						}}
					/>
					<div className="flex-1">
						<p
							className="text-xs font-medium"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("practice.next_block")}
						</p>
						<p
							className="text-sm font-semibold"
							style={{ color: "var(--color-text-primary)" }}
						>
							{nextBlock.label} · {nextBlock.durationMinutes}m
						</p>
					</div>
				</div>
			)}

			{/* Controls — hidden during "waiting to start" overlay for guided blocks */}
			{!isWaitingToStart && (
				<div className="flex items-center justify-center gap-3 pt-2">
					<button
						type="button"
						onClick={timer.prevBlock}
						disabled={timer.isFirstBlock}
						aria-label={t("practice.aria_prev_block")}
						className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border-soft)",
							color: "var(--color-text-secondary)",
						}}
					>
						<SkipBack size={18} />
					</button>

					<motion.button
						whileTap={{ scale: 0.92 }}
						onClick={
							timer.isRunning
								? timer.pause
								: timer.globalElapsedSec > 0
									? timer.resume
									: startTimerWithBackend
						}
						aria-label={timer.isRunning ? t("practice.aria_pause") : t("practice.aria_play")}
						className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
						style={{ backgroundColor: blockColor }}
					>
						{timer.isRunning ? (
							<Pause size={24} />
						) : (
							<Play size={24} className="ml-0.5" />
						)}
					</motion.button>

					<button
						type="button"
						onClick={timer.nextBlock}
						disabled={timer.isLastBlock}
						aria-label={t("practice.aria_next_block")}
						className="w-11 h-11 rounded-full flex items-center justify-center border disabled:opacity-30 transition"
						style={{
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border-soft)",
							color: "var(--color-text-secondary)",
						}}
					>
						<SkipForward size={18} />
					</button>
				</div>
			)}

			{/* Finish / Abandon */}
			{isTutorMode && (
				<>
					<Button variant="outline" className="w-full" onClick={openSafePause}>
						{t("practice.safe_pause")}
					</Button>
					{safePauseOpen && (
						<div
							className="rounded-2xl p-4 border flex flex-col gap-3"
							style={{
								backgroundColor: "var(--color-surface-card)",
								borderColor: "var(--color-border-soft)",
							}}
						>
							<p
								className="text-sm font-semibold"
								style={{ color: "var(--color-text-primary)" }}
							>
								{t("practice.safe_pause_title")}
							</p>
							<p
								className="text-xs"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{t("practice.safe_pause_subtitle")}
							</p>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-secondary)" }}
							>
								1. {t("practice.safe_pause_step_1")}
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-secondary)" }}
							>
								2. {t("practice.safe_pause_step_2")}
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-secondary)" }}
							>
								3. {t("practice.safe_pause_step_3")}
							</div>
							{(anchorPhrase || anchorBodyCue) && (
								<div
									className="rounded-xl p-3 border"
									style={{
										backgroundColor: "var(--color-surface)",
										borderColor: "var(--color-border-soft)",
									}}
								>
									<p
										className="text-[11px] font-semibold mb-1"
										style={{ color: "var(--color-text-primary)" }}
									>
										{t("practice.safe_pause_anchor_title")}
									</p>
									{anchorPhrase && (
										<p
											className="text-xs"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{t("practice.safe_pause_anchor_phrase_label")}:{" "}
											{anchorPhrase}
										</p>
									)}
									{anchorBodyCue && (
										<p
											className="text-xs"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{t("practice.safe_pause_anchor_cue_label")}:{" "}
											{anchorBodyCue}
										</p>
									)}
									<Button
										variant={anchorUsed ? "primary" : "outline"}
										size="sm"
										onClick={() => setAnchorUsed(true)}
										className="mt-2"
									>
										{anchorUsed
											? t("practice.safe_pause_anchor_used")
											: t("practice.safe_pause_anchor_mark_used")}
									</Button>
								</div>
							)}
							<p
								className="text-sm font-bold"
								style={{ color: "var(--color-primary)" }}
							>
								{t("practice.safe_pause_timer", { n: safePauseRemaining })}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									className="flex-1"
									onClick={closeSafePauseAndResume}
								>
									{t("practice.safe_pause_resume")}
								</Button>
								<Button className="flex-1" onClick={handleAbandon}>
									{t("practice.safe_pause_end")}
								</Button>
							</div>
						</div>
					)}
				</>
			)}
			<div className="flex gap-2 pt-2">
				<Button variant="ghost" className="flex-1" onClick={() => {
					timer.pause();
					setAbandonModalOpen(true);
				}}>
					<Square size={14} />
					{t("practice.end_session")}
				</Button>
				<Button className="flex-1" onClick={handleFinish}>
					{t("practice.complete_session")}
				</Button>
			</div>

			<ConfirmModal
				open={abandonModalOpen}
				onClose={() => {
					setAbandonModalOpen(false);
					// Only resume if the timer was previously running
					if (timer.globalElapsedSec > 0) timer.resume();
				}}
				onConfirm={() => {
					setAbandonModalOpen(false);
					handleAbandon();
				}}
				title={t("practice.abandon_title")}
				description={t("practice.abandon_description")}
				confirmLabel={t("practice.abandon_confirm")}
				cancelLabel={t("practice.abandon_cancel")}
				danger
			/>
		</div>
	);
}

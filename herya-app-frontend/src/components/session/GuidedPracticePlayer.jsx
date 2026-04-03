import { useEffect, useRef, useCallback } from "react";
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
import { Button, ProgressBar, CircleProgress } from "@/components/ui";
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
	onComplete,
	onAbandon,
	onSaveProgress,
}) {
	const { t } = useLanguage();
	const timer = useSessionTimer(blocks);
	const prevBlockRef = useRef(timer.currentBlockIndex);
	const blockChangeAudioRef = useRef(null);

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
	}, [timer.currentBlockIndex, timer.isRunning]);

	const handleFinish = useCallback(() => {
		timer.pause();
		onComplete({
			blocksCompleted: timer.currentBlockIndex + 1,
			globalElapsedSec: timer.globalElapsedSec,
		});
	}, [timer, onComplete]);

	const handleAbandon = () => {
		timer.pause();
		onAbandon({
			blocksCompleted: timer.currentBlockIndex,
			globalElapsedSec: timer.globalElapsedSec,
		});
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
						{t("practice.elapsed")}
					</span>
					<span
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.remaining")}: {formatTime(timer.globalRemainingSec)}
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
						{/* Guided VK Player */}
						{isGuidedVK && (
							<PoseByPosePlayer
								sequence={sequencesData[currentBlock.vkSequence]}
								level={currentBlock.level || "beginner"}
								guided={currentBlock.guided}
								autoAdvance={currentBlock.config?.autoAdvancePoses !== false}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Guided Pranayama Player */}
						{isGuidedPranayama && (
							<CycleBreathingPlayer
								pattern={patternsData[currentBlock.breathingPattern]}
								config={currentBlock.config || {}}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Guided Meditation Player */}
						{isGuidedMeditation && (
							<PhasedMeditationPlayer
								meditationType={currentBlock.meditationType || "guided"}
								durationMinutes={currentBlock.durationMinutes || 10}
								config={currentBlock.config || {}}
								guided={currentBlock.guided}
								onComplete={handleBlockPlayerComplete}
							/>
						)}

						{/* Fallback: Timer-only card (non-guided or missing data) */}
						{!hasGuidedPlayer && (
							<div
								className="rounded-2xl p-6 text-center"
								style={{
									backgroundColor: "var(--color-surface-card)",
									border: `2px solid ${blockColor}30`,
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

								<h3
									className="text-xl font-semibold mb-1"
									style={{
										fontFamily: '"DM Sans", sans-serif',
										color: "var(--color-text-primary)",
									}}
								>
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
						backgroundColor: `${BLOCK_TYPE_COLORS[nextBlock.blockType]}08`,
						border: `1px solid ${BLOCK_TYPE_COLORS[nextBlock.blockType]}20`,
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

			{/* Controls — only show play/pause and skip for non-guided blocks */}
			{!hasGuidedPlayer && (
				<div className="flex items-center justify-center gap-3 pt-2">
					<button
						type="button"
						onClick={timer.prevBlock}
						disabled={timer.isFirstBlock}
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
									: timer.start
						}
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
			<div className="flex gap-2 pt-2">
				<Button variant="ghost" className="flex-1" onClick={handleAbandon}>
					<Square size={14} />
					{t("practice.end_session")}
				</Button>
				<Button className="flex-1" onClick={handleFinish}>
					{t("practice.complete_session")}
				</Button>
			</div>
		</div>
	);
}

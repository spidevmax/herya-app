import { AnimatePresence, motion, Reorder } from "framer-motion";
import {
	AlertTriangle,
	ArrowLeftRight,
	BookOpen,
	ChevronDown,
	ChevronUp,
	Clock,
	GripVertical,
	Minus,
	PersonStanding,
	Plus,
	Timer,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getBreathingPatterns } from "@/api/breathing.api";
import { getSequences } from "@/api/sequences.api";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import {
	distributePoseTime,
	formatPoseDuration,
} from "@/utils/distributePoseTime";
import BreathingPatternPicker from "./BreathingPatternPicker";
import SequencePicker from "./SequencePicker";

const MEDITATION_STYLES = [
	"guided",
	"silent",
	"breath_awareness",
	"mantra",
	"visualization",
];

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60];

const getPranayamaEstimatedMinutes = (block, pattern) => {
	if (block?.blockType !== "pranayama" || !pattern) return null;

	const cycles = Number(block.config?.cycles);
	if (!Number.isFinite(cycles) || cycles <= 0) return null;

	const ratio = block.config?.customRatio || pattern.patternRatio || {};
	const base = Number(pattern.baseBreathDuration) || 4;
	const cycleSec =
		((Number(ratio.inhale) || 0) +
			(Number(ratio.hold) || 0) +
			(Number(ratio.exhale) || 0) +
			(Number(ratio.holdAfterExhale) || 0)) *
		base;

	if (cycleSec <= 0) return null;

	const pause = Math.max(0, Number(block.config?.pauseBetweenCycles) || 0);
	const totalSec = cycleSec * cycles + pause * Math.max(0, cycles - 1);

	return Math.max(1, Math.ceil(totalSec / 60));
};

let blockIdCounter = 0;
const nextBlockId = () => `block_${++blockIdCounter}_${Date.now()}`;
export default function SessionBuilder({
	practiceType,
	initialBlocks = [],
	onStartSession,
	onBlocksChange,
}) {
	const { t } = useLanguage();
	const [blocks, setBlocks] = useState([]);
	const [sequences, setSequences] = useState([]);
	const [breathingPatterns, setBreathingPatterns] = useState([]);
	const [loading, setLoading] = useState(true);
	const [addMenuOpen, setAddMenuOpen] = useState(false);
	const [hasHydratedInitialBlocks, setHasHydratedInitialBlocks] =
		useState(false);

	// Which block types can this practice type include
	const allowedBlockTypes = useMemo(() => {
		switch (practiceType) {
			case "vk_sequence":
				return ["vk_sequence"];
			case "pranayama":
				return ["pranayama"];
			case "meditation":
				return ["meditation"];
			case "complete_practice":
				return ["vk_sequence", "pranayama", "meditation"];
			default:
				return [];
		}
	}, [practiceType]);

	useEffect(() => {
		setLoading(true);
		setHasHydratedInitialBlocks(false);
		const promises = [];
		if (allowedBlockTypes.includes("vk_sequence")) {
			promises.push(
				getSequences({ limit: 100 }).then((r) => {
					const payload = r.data?.data || r.data || {};
					const list =
						payload.sequences ?? (Array.isArray(payload) ? payload : []);
					setSequences(Array.isArray(list) ? list : []);
				}),
			);
		}
		if (allowedBlockTypes.includes("pranayama")) {
			promises.push(
				getBreathingPatterns({ limit: 100 }).then((r) => {
					const payload = r.data?.data || r.data || {};
					const list =
						payload.patterns ?? (Array.isArray(payload) ? payload : []);
					setBreathingPatterns(Array.isArray(list) ? list : []);
				}),
			);
		}
		Promise.all(promises)
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [allowedBlockTypes]);

	useEffect(() => {
		if (
			hasHydratedInitialBlocks ||
			blocks.length > 0 ||
			!initialBlocks.length
		) {
			return;
		}

		const hydrated = initialBlocks
			.filter((block) => allowedBlockTypes.includes(block.blockType))
			.map((block) => {
				const defaultConfig = {
					cycles: null,
					soundCue: "bell",
					hapticFeedback: true,
					autoAdvancePoses: true,
				};

				return {
					id: nextBlockId(),
					label: "",
					durationMinutes:
						block.blockType === "meditation"
							? 10
							: block.blockType === "pranayama"
								? 0
								: 15,
					vkSequence: null,
					breathingPattern: null,
					meditationType: "silent",
					guided: true,
					level: "beginner",
					...block,
					config: {
						...defaultConfig,
						...(block.config || {}),
					},
				};
			});

		if (hydrated.length > 0) {
			setBlocks(hydrated);
		}
		setHasHydratedInitialBlocks(true);
	}, [
		allowedBlockTypes,
		blocks.length,
		hasHydratedInitialBlocks,
		initialBlocks,
	]);

	const getEffectiveBlockDurationMinutes = useCallback(
		(block) => {
			if (block.blockType !== "pranayama")
				return Number(block.durationMinutes) || 0;

			const selectedPattern = breathingPatterns.find(
				(pattern) => pattern._id === block.breathingPattern,
			);
			const estimated = getPranayamaEstimatedMinutes(block, selectedPattern);

			return estimated ?? (Number(block.durationMinutes) || 0);
		},
		[breathingPatterns],
	);

	const totalMinutes = useMemo(
		() =>
			blocks.reduce(
				(sum, block) => sum + getEffectiveBlockDurationMinutes(block),
				0,
			),
		[blocks, getEffectiveBlockDurationMinutes],
	);

	useEffect(() => {
		onBlocksChange?.(blocks, totalMinutes);
	}, [blocks, totalMinutes, onBlocksChange]);

	const addBlock = (blockType) => {
		const newBlock = {
			id: nextBlockId(),
			blockType,
			label: "",
			durationMinutes:
				blockType === "meditation" ? 10 : blockType === "pranayama" ? 0 : 15,
			vkSequence: null,
			breathingPattern: null,
			meditationType: "silent",
			guided: true,
			level: "beginner",
			config: {
				cycles: null,
				soundCue: "bell",
				hapticFeedback: true,
				autoAdvancePoses: true,
			},
		};
		setBlocks((prev) => [...prev, newBlock]);
		setAddMenuOpen(false);
	};

	const removeBlock = (id) => {
		setBlocks((prev) => prev.filter((b) => b.id !== id));
	};

	const updateBlock = (id, updates) => {
		setBlocks((prev) =>
			prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
		);
	};

	const isBlockConfigured = (block) => {
		switch (block.blockType) {
			case "vk_sequence":
				return Boolean(block.vkSequence);
			case "pranayama":
				return Boolean(block.breathingPattern);
			case "meditation":
				return Boolean(block.meditationType);
			default:
				return true;
		}
	};

	const canStart =
		blocks.length > 0 &&
		blocks.every((block) => {
			if (!isBlockConfigured(block)) return false;
			// VK blocks must have a valid duration
			if (
				block.blockType === "vk_sequence" &&
				(!block.durationMinutes || block.durationMinutes <= 0)
			) {
				return false;
			}
			// Pranayama blocks must have a computable duration > 0
			if (
				block.blockType === "pranayama" &&
				getEffectiveBlockDurationMinutes(block) <= 0
			) {
				return false;
			}
			return true;
		});

	const handleStart = () => {
		if (!canStart) return;
		const ordered = blocks.map((b, i) => ({
			blockType: b.blockType,
			label: b.label || getBlockDefaultLabel(b),
			durationMinutes: getEffectiveBlockDurationMinutes(b),
			order: i,
			vkSequence: b.vkSequence || undefined,
			breathingPattern: b.breathingPattern || undefined,
			meditationType: b.meditationType || undefined,
			guided: b.guided,
			level: b.level,
			config: b.config || {},
		}));
		onStartSession(ordered, totalMinutes);
	};

	const getBlockDefaultLabel = (block) => {
		if (block.blockType === "vk_sequence" && block.vkSequence) {
			const seq = sequences.find((s) => s._id === block.vkSequence);
			return seq?.englishName || t("practice.vk_block");
		}
		if (block.blockType === "pranayama" && block.breathingPattern) {
			const bp = breathingPatterns.find(
				(p) => p._id === block.breathingPattern,
			);
			return bp?.romanizationName || t("practice.pranayama_block");
		}
		if (block.blockType === "meditation") {
			return (
				t(`session.meditation_types.${block.meditationType}`) ||
				t("practice.meditation_block")
			);
		}
		return t(`practice.type_${block.blockType}`);
	};

	const blockTypeLabel = (bt) => t(`practice.type_${bt}`);

	const blockTypeColor = (bt) => {
		switch (bt) {
			case "vk_sequence":
				return "var(--color-primary)";
			case "pranayama":
				return "var(--color-secondary)";
			case "meditation":
				return "var(--color-accent)";
			default:
				return "var(--color-primary)";
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="text-center">
					<div className="mb-3 flex justify-center">
						<PersonStanding
							size={38}
							style={{ color: "var(--color-primary)" }}
						/>
					</div>
					<p
						style={{ color: "var(--color-text-secondary)" }}
						className="text-sm"
					>
						{t("practice.loading_catalog")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<section
			aria-label={t("practice.build_session_title")}
			className="flex flex-col gap-4 pt-2"
		>
			{/* Header with total time */}
			<header className="flex items-center justify-end">
				<div
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow"
					style={{
						backgroundColor: "rgba(67, 56, 202, 0.85)", // fallback for var
						background:
							"linear-gradient(90deg, var(--color-primary) 80%, var(--color-primary-light, #818CF8) 100%)",
						color: "#fff",
					}}
				>
					<Clock size={14} />
					{totalMinutes} min
				</div>
			</header>

			<h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
				{t("practice.build_session_title")}
			</h2>

			{/* Block list (reorderable) */}
			{blocks.length > 0 ? (
				<Reorder.Group
					axis="y"
					values={blocks}
					onReorder={setBlocks}
					className="flex flex-col gap-2"
				>
					{blocks.map((block, idx) => (
						<Reorder.Item key={block.id} value={block} className="touch-none">
							<BlockCard
								block={block}
								index={idx}
								sequences={sequences}
								breathingPatterns={breathingPatterns}
								onUpdate={(updates) => updateBlock(block.id, updates)}
								onRemove={() => removeBlock(block.id)}
								blockTypeColor={blockTypeColor}
								blockTypeLabel={blockTypeLabel}
								t={t}
							/>
						</Reorder.Item>
					))}
				</Reorder.Group>
			) : (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="rounded-2xl border-2 border-dashed p-8 text-center"
					style={{ borderColor: "var(--color-border)" }}
				>
					<p
						className="text-sm mb-1"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("practice.empty_blocks")}
					</p>
					<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
						{t("practice.empty_blocks_hint")}
					</p>
				</motion.div>
			)}

			{/* Add block button */}
			<div className="relative">
				<Button
					variant="outline"
					className="w-full"
					onClick={() => setAddMenuOpen((o) => !o)}
				>
					<Plus size={16} />
					{t("practice.add_block")}
				</Button>

				<AnimatePresence>
					{addMenuOpen && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-lg z-10 overflow-hidden border"
							style={{
								backgroundColor: "var(--color-surface-card)",
								borderColor: "var(--color-border-soft)",
							}}
						>
							{allowedBlockTypes.map((bt) => (
								<button
									type="button"
									key={bt}
									onClick={() => addBlock(bt)}
									className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:brightness-95 transition"
									style={{ color: "var(--color-text-primary)" }}
								>
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: blockTypeColor(bt) }}
									/>
									{blockTypeLabel(bt)}
								</button>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Start button */}
			<Button
				onClick={handleStart}
				disabled={!canStart}
				size="lg"
				className="w-full mt-2"
			>
				{t("practice.start_session")} ({totalMinutes} min)
			</Button>
		</section>
	);
}

function BlockCard({
	block,
	index,
	sequences,
	breathingPatterns,
	onUpdate,
	onRemove,
	blockTypeColor,
	blockTypeLabel,
	t,
}) {
	const [expanded, setExpanded] = useState(true);
	const color = blockTypeColor(block.blockType);

	const selectedPattern = breathingPatterns.find(
		(p) => p._id === block.breathingPattern,
	);

	// Calculate estimated duration from cycles for pranayama
	const estimatedFromCycles = getPranayamaEstimatedMinutes(
		block,
		selectedPattern,
	);

	// VK time distribution
	const selectedSequence = sequences.find((s) => s._id === block.vkSequence);
	const vkDistribution = useMemo(() => {
		if (block.blockType !== "vk_sequence" || !selectedSequence) return null;
		const corePoses = selectedSequence.structure?.corePoses || [];
		if (!corePoses.length) return null;
		return distributePoseTime({
			corePoses,
			blockTotalSec: (block.durationMinutes || 0) * 60,
			level: block.level || "beginner",
			mode: block.config?.distributionMode || "auto",
			manualOverrides: block.config?.manualOverrides || {},
		});
	}, [
		block.blockType,
		block.durationMinutes,
		block.level,
		block.config?.distributionMode,
		block.config?.manualOverrides,
		selectedSequence,
	]);

	return (
		<motion.article
			layout
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="rounded-2xl overflow-hidden border"
			style={{
				backgroundColor: "var(--color-surface-card)",
				borderColor: "var(--color-border-soft)",
				borderLeft: `3px solid ${color}`,
			}}
		>
			{/* Header */}
			<header className="flex items-center gap-2 px-3 py-2">
				<GripVertical
					size={16}
					className="cursor-grab"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<span
					className="text-[11px] font-semibold uppercase tracking-[0.18em]"
					style={{ color }}
				>
					{index + 1}. {blockTypeLabel(block.blockType)}
				</span>

				{/* Siempre guiado */}
				<span
					className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
					style={{
						backgroundColor: `${color}15`,
						color,
						border: `1px solid ${color}`,
					}}
					title={t("guided.mode_guided")}
				>
					<BookOpen size={10} />
					{t("guided.guided")}
				</span>

				<span
					className="ml-auto text-xs font-medium"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{estimatedFromCycles
						? `${estimatedFromCycles}m`
						: block.blockType === "pranayama"
							? "--"
							: `${block.durationMinutes}m`}
				</span>
				<button
					type="button"
					onClick={() => setExpanded((e) => !e)}
					className="p-1 rounded-lg"
					style={{ color: "var(--color-text-muted)" }}
				>
					{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
				</button>
				<button
					type="button"
					onClick={onRemove}
					className="p-1 rounded-lg"
					style={{ color: "var(--color-danger, #EF4444)" }}
				>
					<X size={14} />
				</button>
			</header>

			{/* Expanded config */}
			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden"
					>
						<div className="px-3 pb-3 flex flex-col gap-2.5">
							{/* VK Sequence picker */}
							{block.blockType === "vk_sequence" && (
								<>
									<SequencePicker
										sequences={sequences}
										selectedId={block.vkSequence}
										onSelect={(seq) => {
											onUpdate({
												vkSequence: seq._id,
												label: seq.englishName || "",
												durationMinutes:
													seq.estimatedDuration?.recommended ||
													block.durationMinutes,
											});
										}}
									/>

									{/* Per-pose time breakdown */}
									{vkDistribution && vkDistribution.poses.length > 0 && (
										<VKPoseBreakdown
											distribution={vkDistribution}
											distributionMode={
												block.config?.distributionMode || "auto"
											}
											onChangeMode={(mode) =>
												onUpdate({
													config: {
														...block.config,
														distributionMode: mode,
														manualOverrides:
															mode === "manual"
																? block.config?.manualOverrides || {}
																: {},
													},
												})
											}
											onManualOverride={(idx, sec) =>
												onUpdate({
													config: {
														...block.config,
														manualOverrides: {
															...(block.config?.manualOverrides || {}),
															[idx]: sec,
														},
													},
												})
											}
											color={color}
											t={t}
										/>
									)}
								</>
							)}

							{/* Pranayama pattern picker + cycle config */}
							{block.blockType === "pranayama" && (
								<>
									<BreathingPatternPicker
										patterns={breathingPatterns}
										selectedId={block.breathingPattern}
										onSelect={(pat) => {
											onUpdate({
												breathingPattern: pat._id,
												label: pat.romanizationName || "",
												config: {
													...block.config,
													cycles:
														pat.recommendedPractice?.cycles?.default || 10,
												},
											});
										}}
									/>

									{/* Cycle configuration */}
									{selectedPattern && (
										<div
											className="rounded-xl p-2.5 flex flex-col gap-1.5"
											style={{
												backgroundColor: "var(--color-surface)",
												border: "1px solid var(--color-border-soft)",
											}}
										>
											<p
												className="text-xs font-semibold"
												style={{ color: "var(--color-text-secondary)" }}
											>
												{t("guided.cycle_config")}
											</p>

											{/* Cycle count stepper */}
											<div className="flex items-center justify-between">
												<span
													className="text-xs"
													style={{ color: "var(--color-text-secondary)" }}
												>
													{t("guided.cycles")}
												</span>
												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() =>
															onUpdate({
																config: {
																	...block.config,
																	cycles: Math.max(
																		1,
																		(block.config?.cycles || 10) - 1,
																	),
																},
															})
														}
														className="w-6 h-6 rounded-lg flex items-center justify-center border"
														style={{
															borderColor: "var(--color-border-soft)",
															color: "var(--color-text-secondary)",
														}}
													>
														<Minus size={12} />
													</button>
													<span
														className="text-xs font-bold w-7 text-center"
														style={{ color: "var(--color-text-primary)" }}
													>
														{block.config?.cycles || 10}
													</span>
													<button
														type="button"
														onClick={() =>
															onUpdate({
																config: {
																	...block.config,
																	cycles: (block.config?.cycles || 10) + 1,
																},
															})
														}
														className="w-6 h-6 rounded-lg flex items-center justify-center border"
														style={{
															borderColor: "var(--color-border-soft)",
															color: "var(--color-text-secondary)",
														}}
													>
														<Plus size={12} />
													</button>
												</div>
											</div>

											{/* Estimated duration from cycles */}
											{estimatedFromCycles && (
												<p
													className="text-[10px]"
													style={{ color: "var(--color-text-muted)" }}
												>
													{t("guided.estimated_duration")}:{estimatedFromCycles}{" "}
													min
												</p>
											)}

											{/* Ratio display */}
											<div className="flex items-center gap-1">
												<span
													className="text-xs"
													style={{ color: "var(--color-text-secondary)" }}
												>
													{t("guided.ratio")}:
												</span>
												<span
													className="text-xs font-mono font-bold"
													style={{ color }}
												>
													{selectedPattern.patternRatio?.inhale || 0}:
													{selectedPattern.patternRatio?.hold || 0}:
													{selectedPattern.patternRatio?.exhale || 0}:
													{selectedPattern.patternRatio?.holdAfterExhale || 0}
												</span>
											</div>
										</div>
									)}
								</>
							)}

							{/* Meditation type */}
							{block.blockType === "meditation" && (
								<>
									<select
										value={block.meditationType}
										onChange={(e) =>
											onUpdate({
												meditationType: e.target.value,
												label:
													t(`session.meditation_types.${e.target.value}`) ||
													e.target.value,
											})
										}
										className="w-full rounded-xl border px-3 py-2 text-sm"
										style={{
											backgroundColor: "var(--color-surface)",
											borderColor: "var(--color-border-soft)",
											color: "var(--color-text-primary)",
										}}
									>
										{MEDITATION_STYLES.map((style) => (
											<option key={style} value={style}>
												{t(`session.meditation_types.${style}`)}
											</option>
										))}
									</select>
								</>
							)}

							{/* Duration selector (manual for meditation and VK sequence only) */}
							{(block.blockType === "meditation" ||
								block.blockType === "vk_sequence") && (
								<div>
									<p
										className="text-xs font-medium mb-2"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{t("practice.block_duration")}
									</p>
									<div className="flex gap-1.5 flex-wrap">
										{DURATION_PRESETS.map((d) => (
											<button
												type="button"
												key={d}
												onClick={() => onUpdate({ durationMinutes: d })}
												className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
												style={{
													backgroundColor:
														block.durationMinutes === d
															? color
															: "var(--color-surface)",
													color:
														block.durationMinutes === d
															? "white"
															: "var(--color-text-secondary)",
												}}
											>
												{d}m
											</button>
										))}
									</div>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.article>
	);
}

const DISTRIBUTION_MODES = ["auto", "equal", "manual"];

function VKPoseBreakdown({
	distribution,
	distributionMode,
	onChangeMode,
	onManualOverride,
	color,
	t,
}) {
	const { poses, warning, naturalSec, totalSec } = distribution;
	const [showAdvanced, setShowAdvanced] = useState(false);

	return (
		<div
			className="rounded-xl p-2.5 flex flex-col gap-2"
			style={{
				backgroundColor: "var(--color-surface)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			{/* Header with advanced toggle */}
			<div className="flex items-center justify-between">
				<p
					className="text-xs font-semibold"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("practice.time_distribution")}
				</p>
				<button
					type="button"
					onClick={() => setShowAdvanced((v) => !v)}
					className="flex items-center gap-1 text-[10px] font-medium transition"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("practice.advanced_timing")}
					{showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
				</button>
			</div>

			{/* Distribution mode selector (collapsed by default) */}
			<AnimatePresence>
				{showAdvanced && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden"
					>
						<div className="flex gap-1 pb-1">
							{DISTRIBUTION_MODES.map((mode) => (
								<button
									key={mode}
									type="button"
									onClick={() => onChangeMode(mode)}
									className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition"
									style={{
										backgroundColor:
											distributionMode === mode ? color : "transparent",
										color:
											distributionMode === mode
												? "white"
												: "var(--color-text-muted)",
									}}
								>
									{t(`practice.dist_${mode}`)}
								</button>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Warning */}
			{warning && (
				<div
					className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium"
					style={{
						backgroundColor: "var(--color-warning-bg, #FEF3C7)",
						color: "var(--color-warning-text, #92400E)",
					}}
				>
					<AlertTriangle size={12} />
					{warning === "insufficient_time"
						? t("practice.warn_insufficient_time")
						: warning === "manual_overflow"
							? t("practice.warn_manual_overflow")
							: t("practice.warn_invalid_duration")}
				</div>
			)}

			{/* Pose list */}
			<div className="flex flex-col gap-1">
				{poses.map((p) => (
					<div
						key={p.index}
						className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
						style={{
							backgroundColor: p.manual ? `${color}08` : "transparent",
						}}
					>
						{/* Pose name */}
						<span
							className="text-xs flex-1 truncate"
							style={{ color: "var(--color-text-primary)" }}
						>
							{p.poseName}
						</span>

						{/* Bilateral indicator */}
						{p.bilateral && (
							<span
								className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
								style={{
									backgroundColor: `${color}15`,
									color,
								}}
							>
								<ArrowLeftRight size={9} />
								{formatPoseDuration(p.perSideSec)}/{t("practice.side")}
							</span>
						)}

						{/* Time display / manual input */}
						{distributionMode === "manual" ? (
							<div className="flex items-center gap-1">
								<button
									type="button"
									onClick={() =>
										onManualOverride(p.index, Math.max(12, p.totalSec - 5))
									}
									className="w-5 h-5 rounded flex items-center justify-center"
									style={{
										backgroundColor: "var(--color-surface-card)",
										color: "var(--color-text-muted)",
										border: "1px solid var(--color-border-soft)",
									}}
								>
									<Minus size={10} />
								</button>
								<span
									className="text-xs font-bold w-10 text-center"
									style={{ color }}
								>
									{formatPoseDuration(p.totalSec)}
								</span>
								<button
									type="button"
									onClick={() => onManualOverride(p.index, p.totalSec + 5)}
									className="w-5 h-5 rounded flex items-center justify-center"
									style={{
										backgroundColor: "var(--color-surface-card)",
										color: "var(--color-text-muted)",
										border: "1px solid var(--color-border-soft)",
									}}
								>
									<Plus size={10} />
								</button>
							</div>
						) : (
							<span className="text-xs font-bold" style={{ color }}>
								{formatPoseDuration(p.totalSec)}
							</span>
						)}

						{/* Breaths */}
						<span
							className="text-[10px]"
							style={{ color: "var(--color-text-muted)" }}
						>
							{p.breaths}b
						</span>
					</div>
				))}
			</div>

			{/* Footer: natural vs allocated */}
			<div
				className="flex items-center justify-between pt-1 border-t"
				style={{ borderColor: "var(--color-border-soft)" }}
			>
				<span
					className="text-[10px]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("practice.natural_duration")}: {formatPoseDuration(naturalSec)}
				</span>
				<span
					className="text-[10px] font-semibold"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("practice.total")}: {formatPoseDuration(totalSec)}
				</span>
			</div>
		</div>
	);
}

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
	Plus,
	X,
	Clock,
	GripVertical,
	ChevronDown,
	ChevronUp,
	PersonStanding,
	BookOpen,
	Timer,
	Minus,
} from "lucide-react";
import { getSequences } from "@/api/sequences.api";
import { getBreathingPatterns } from "@/api/breathing.api";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import SequencePicker from "./SequencePicker";
import BreathingPatternPicker from "./BreathingPatternPicker";

const MEDITATION_STYLES = [
	"guided",
	"silent",
	"breath_awareness",
	"mantra",
	"visualization",
];

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60];

let blockIdCounter = 0;
const nextBlockId = () => `block_${++blockIdCounter}_${Date.now()}`;
export default function SessionBuilder({
	practiceType,
	initialBlocks = [],
	onStartSession,
	onBack,
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
					bellInterval: 0,
					bellAtStart: true,
					bellAtEnd: true,
				};

				return {
					id: nextBlockId(),
					label: "",
					durationMinutes: block.blockType === "meditation" ? 10 : 15,
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

	const totalMinutes = blocks.reduce(
		(sum, b) => sum + (b.durationMinutes || 0),
		0,
	);

	const addBlock = (blockType) => {
		const newBlock = {
			id: nextBlockId(),
			blockType,
			label: "",
			durationMinutes: blockType === "meditation" ? 10 : 15,
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
				bellInterval: 0,
				bellAtStart: true,
				bellAtEnd: true,
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

	const handleStart = () => {
		if (blocks.length === 0) return;
		const ordered = blocks.map((b, i) => ({
			blockType: b.blockType,
			label: b.label || getBlockDefaultLabel(b),
			durationMinutes: b.durationMinutes,
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
		<div className="flex flex-col gap-4 pt-2">
			{/* Header with back and total time */}
			<div className="flex items-center justify-between">
				<button
					type="button"
					onClick={onBack}
					className="text-sm font-medium"
					style={{ color: "var(--color-primary)" }}
				>
					{t("practice.change_type")}
				</button>
				<div
					className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
					style={{
						backgroundColor: "var(--color-primary-light, #EEF2FF)",
						color: "var(--color-primary)",
					}}
				>
					<Clock size={14} />
					{totalMinutes} min
				</div>
			</div>

			<h2
				className="text-xl font-semibold"
				style={{
					fontFamily: '"DM Sans", sans-serif',
					color: "var(--color-text-primary)",
				}}
			>
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
				disabled={blocks.length === 0}
				size="lg"
				className="w-full mt-2"
			>
				{t("practice.start_session")} ({totalMinutes} min)
			</Button>
		</div>
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
	const estimatedFromCycles = (() => {
		if (
			block.blockType !== "pranayama" ||
			!selectedPattern ||
			!block.config?.cycles
		)
			return null;
		const cp =
			selectedPattern.calculatedPattern || selectedPattern.patternRatio;
		if (!cp) return null;
		const base = selectedPattern.baseBreathDuration || 4;
		const ratio = selectedPattern.patternRatio || {};
		const cycleSec =
			(ratio.inhale +
				ratio.hold +
				ratio.exhale +
				(ratio.holdAfterExhale || 0)) *
			base;
		const pause = block.config.pauseBetweenCycles || 0;
		const totalSec =
			cycleSec * block.config.cycles + pause * (block.config.cycles - 1);
		return Math.ceil(totalSec / 60);
	})();

	return (
		<motion.div
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
			<div className="flex items-center gap-2 px-3 py-3">
				<GripVertical
					size={16}
					className="cursor-grab"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<span
					className="text-xs font-semibold uppercase tracking-wider"
					style={{ color }}
				>
					{index + 1}. {blockTypeLabel(block.blockType)}
				</span>

				{/* Guided toggle */}
				<button
					type="button"
					onClick={() => onUpdate({ guided: !block.guided })}
					className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition"
					style={{
						backgroundColor: block.guided
							? `${color}15`
							: "var(--color-surface)",
						color: block.guided ? color : "var(--color-text-muted)",
						border: `1px solid ${block.guided ? color : "var(--color-border-soft)"}`,
					}}
					aria-pressed={block.guided}
					title={block.guided ? t("guided.mode_guided") : t("guided.mode_free")}
				>
					{block.guided ? <BookOpen size={10} /> : <Timer size={10} />}
					{block.guided ? t("guided.guided") : t("guided.free")}
				</button>

				<span
					className="ml-auto text-xs font-medium"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{estimatedFromCycles
						? `~${estimatedFromCycles}m`
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
			</div>

			{/* Expanded config */}
			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 flex flex-col gap-3">
							{/* VK Sequence picker */}
							{block.blockType === "vk_sequence" && (
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
											className="rounded-xl p-3 flex flex-col gap-2"
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
														className="w-7 h-7 rounded-lg flex items-center justify-center border"
														style={{
															borderColor: "var(--color-border-soft)",
															color: "var(--color-text-secondary)",
														}}
													>
														<Minus size={12} />
													</button>
													<span
														className="text-sm font-bold w-8 text-center"
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
														className="w-7 h-7 rounded-lg flex items-center justify-center border"
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
													{t("guided.estimated_duration")}: ~
													{estimatedFromCycles} min
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

									{/* Bell interval config (guided meditation) */}
									{block.guided && (
										<div className="flex items-center justify-between">
											<span
												className="text-xs"
												style={{ color: "var(--color-text-secondary)" }}
											>
												{t("guided.bell_interval")}
											</span>
											<div className="flex gap-1.5">
												{[0, 3, 5, 10].map((mins) => (
													<button
														key={mins}
														type="button"
														onClick={() =>
															onUpdate({
																config: {
																	...block.config,
																	bellInterval: mins,
																},
															})
														}
														className="px-2 py-1 rounded-lg text-[10px] font-semibold transition"
														style={{
															backgroundColor:
																(block.config?.bellInterval || 0) === mins
																	? color
																	: "var(--color-surface)",
															color:
																(block.config?.bellInterval || 0) === mins
																	? "white"
																	: "var(--color-text-secondary)",
														}}
													>
														{mins === 0 ? t("guided.bell_off") : `${mins}m`}
													</button>
												))}
											</div>
										</div>
									)}
								</>
							)}

							{/* Duration selector (always shown for meditation, shown for VK/pranayama if no cycle config) */}
							{(block.blockType === "meditation" ||
								block.blockType === "vk_sequence" ||
								(block.blockType === "pranayama" && !block.config?.cycles)) && (
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
		</motion.div>
	);
}

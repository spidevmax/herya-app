import { motion } from "framer-motion";
import { Check, Leaf, PersonStanding, Wind } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const BLOCK_ICONS = {
	vk_sequence: PersonStanding,
	pranayama: Wind,
	meditation: Leaf,
};

const BLOCK_COLORS = {
	vk_sequence: "var(--chandra)",
	pranayama: "var(--surya)",
	meditation: "var(--ink)",
};

// Paired with BLOCK_COLORS so a fill and its text can never drift apart.
const BLOCK_FG = {
	vk_sequence: "var(--on-fill)",
	pranayama: "var(--on-fill)",
	meditation: "var(--paper)",
};

/**
 * VisualSchedule — predictability board for tutor mode.
 * Shows an ordered visual timeline of session blocks before/during practice.
 * Uses icons + colors + concrete labels so neurodivergent children
 * know exactly what's coming next.
 *
 * Props:
 * - blocks: array of planned blocks
 * - currentBlockIndex: which block is active (-1 = not started)
 * - compact: if true, renders a smaller inline version
 */
const VisualSchedule = ({
	blocks = [],
	currentBlockIndex = -1,
	compact = false,
}) => {
	const { t } = useLanguage();

	if (blocks.length === 0) return null;

	return (
		<section
			className={`rounded-2xl ${compact ? "p-3" : "p-4"}`}
			style={{
				backgroundColor: "var(--paper-raised)",
				border: "var(--ink-width) solid var(--ink)",
			}}
			aria-label={t("practice.visual_schedule_label")}
		>
			<h3
				className="text-[10px] font-bold mb-3"
				style={{ color: "var(--ink-soft)" }}
			>
				{t("practice.visual_schedule_title")}
			</h3>

			<ol className="flex flex-col gap-2 list-none m-0 p-0">
				{blocks.map((block, idx) => {
					const Icon = BLOCK_ICONS[block.blockType] || Leaf;
					const color = BLOCK_COLORS[block.blockType] || "var(--chandra)";
					const fg = BLOCK_FG[block.blockType] || "var(--on-fill)";
					const isDone = idx < currentBlockIndex;
					const isCurrent = idx === currentBlockIndex;
					const isFuture = idx > currentBlockIndex;

					return (
						<motion.li
							key={block._id || block.id || `schedule-${idx}`}
							initial={{ opacity: 0, x: -12 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: idx * 0.06 }}
							className={`flex items-center gap-3 rounded-xl px-3 ${compact ? "py-2" : "py-2.5"} transition-all`}
							style={{
								backgroundColor: isCurrent
									? `color-mix(in srgb, ${color} 12%, transparent)`
									: "transparent",
								border: isCurrent
									? `2px solid ${color}`
									: "2px solid transparent",
								opacity: isFuture ? 0.55 : 1,
							}}
							aria-current={isCurrent ? "step" : undefined}
							aria-label={`${t("practice.visual_schedule_step", { n: idx + 1 })}: ${block.label}`}
						>
							{/* Step indicator */}
							<div
								className="w-9 h-9 min-w-[2.25rem] rounded-full flex items-center justify-center"
								style={{
									backgroundColor: isDone
										? color
										: isCurrent
											? color
											: "var(--paper)",
									border: "var(--ink-width) solid var(--ink)",
								}}
							>
								{isDone ? (
									<Check size={16} strokeWidth={3} style={{ color: fg }} />
								) : (
									<Icon
										size={compact ? 14 : 16}
										style={{
											color: isCurrent ? fg : "var(--ink-soft)",
										}}
									/>
								)}
							</div>

							{/* Label */}
							<div className="flex-1 min-w-0">
								<p
									className={`${compact ? "text-xs" : "text-sm"} font-semibold truncate`}
									style={{
										color: isDone ? "var(--ink-soft)" : "var(--ink)",
										textDecoration: isDone ? "line-through" : "none",
									}}
								>
									{block.label}
								</p>
								<p className="text-[10px]" style={{ color: "var(--ink-soft)" }}>
									{t(`practice.type_${block.blockType}`)} ·{" "}
									{block.durationMinutes}m
								</p>
							</div>

							{/* Current indicator */}
							{isCurrent && (
								<motion.div
									animate={{ scale: [1, 1.3, 1] }}
									transition={{ repeat: Infinity, duration: 2 }}
									className="w-2.5 h-2.5 rounded-full"
									style={{ backgroundColor: color }}
								/>
							)}
						</motion.li>
					);
				})}
			</ol>
		</section>
	);
};

export default VisualSchedule;

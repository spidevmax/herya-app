import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PersonStanding, Wind, Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const BLOCK_ICONS = {
	vk_sequence: PersonStanding,
	pranayama: Wind,
	meditation: Leaf,
};

const BLOCK_COLORS = {
	vk_sequence: "var(--color-primary)",
	pranayama: "var(--color-secondary)",
	meditation: "var(--color-accent)",
};

const COUNTDOWN_SEC = 5;

/**
 * TransitionWarning — 5-second countdown shown before switching blocks.
 * Prevents abrupt transitions that can trigger dysregulation.
 *
 * Props:
 * - nextBlock: the upcoming block object
 * - visible: whether the warning is currently shown
 * - onCountdownEnd: called when countdown reaches 0
 */
export default function TransitionWarning({
	nextBlock,
	visible = false,
	onCountdownEnd,
}) {
	const { t } = useLanguage();
	const [remaining, setRemaining] = useState(COUNTDOWN_SEC);

	useEffect(() => {
		if (!visible) {
			setRemaining(COUNTDOWN_SEC);
			return;
		}

		const id = setInterval(() => {
			setRemaining((prev) => {
				if (prev <= 1) {
					clearInterval(id);
					onCountdownEnd?.();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(id);
	}, [visible, onCountdownEnd]);

	if (!nextBlock) return null;

	const Icon = BLOCK_ICONS[nextBlock.blockType] || Leaf;
	const color = BLOCK_COLORS[nextBlock.blockType] || "var(--color-primary)";

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.9 }}
					className="fixed inset-0 z-50 flex items-center justify-center p-6"
					style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
					role="alert"
					aria-live="assertive"
					aria-label={t("practice.transition_warning_aria", {
						block: nextBlock.label,
						n: remaining,
					})}
				>
					<motion.div
						className="rounded-3xl p-6 text-center max-w-xs w-full"
						style={{
							backgroundColor: "var(--color-surface-card)",
							border: `3px solid ${color}`,
						}}
					>
						<div
							className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
							style={{
								backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
							}}
						>
							<Icon size={32} style={{ color }} />
						</div>

						<p
							className="text-xs font-bold uppercase tracking-widest mb-1"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("practice.transition_next")}
						</p>

						<h3
							className="text-lg font-semibold mb-1"
							style={{ color: "var(--color-text-primary)" }}
						>
							{nextBlock.label}
						</h3>

						<p
							className="text-sm mb-4"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{t(`practice.type_${nextBlock.blockType}`)} ·{" "}
							{nextBlock.durationMinutes}m
						</p>

						{/* Countdown */}
						<motion.div
							key={remaining}
							initial={{ scale: 1.4, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className="text-4xl font-bold"
							style={{ color }}
						>
							{remaining}
						</motion.div>

						<p
							className="text-xs mt-2"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("practice.transition_countdown")}
						</p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

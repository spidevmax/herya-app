import { motion } from "framer-motion";
import { Star, Flame, Sprout } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * SessionRewards — gentle reward/progress visualization.
 * Shows stars for completed sessions, streak flame, and a growing "garden" sprout.
 * Designed to be encouraging without being anxiety-inducing.
 *
 * Props:
 * - totalSessions: number of completed sessions
 * - currentStreak: consecutive practice days
 * - blocksCompleted: blocks completed in current session (for micro-rewards)
 * - compact: smaller variant for inline use
 */
export default function SessionRewards({
	totalSessions = 0,
	currentStreak = 0,
	blocksCompleted = 0,
	compact = false,
}) {
	const { t } = useLanguage();

	// Growth stage based on total sessions
	const growthStage =
		totalSessions >= 20
			? "tree"
			: totalSessions >= 10
				? "flower"
				: totalSessions >= 5
					? "sprout"
					: "seed";

	const growthColor =
		growthStage === "tree"
			? "var(--color-success)"
			: growthStage === "flower"
				? "var(--color-secondary)"
				: growthStage === "sprout"
					? "var(--color-primary)"
					: "var(--color-text-muted)";

	// Stars earned in current session (1 per block completed)
	const sessionStars = Math.min(5, blocksCompleted);

	return (
		<div
			className={`rounded-2xl ${compact ? "p-3" : "p-4"}`}
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
			aria-label={t("practice.rewards_label")}
		>
			<p
				className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3"
				style={{ color: "var(--color-text-muted)" }}
			>
				{t("practice.rewards_title")}
			</p>

			<div className={`flex ${compact ? "gap-4" : "gap-6"} items-center justify-center`}>
				{/* Garden growth */}
				<div className="flex flex-col items-center gap-1">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 200, damping: 15 }}
					>
						<Sprout
							size={compact ? 24 : 32}
							style={{ color: growthColor }}
						/>
					</motion.div>
					<p
						className="text-[10px] font-medium"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t(`practice.growth_${growthStage}`)}
					</p>
				</div>

				{/* Streak */}
				{currentStreak > 0 && (
					<div className="flex flex-col items-center gap-1">
						<motion.div
							animate={{ y: [0, -3, 0] }}
							transition={{ repeat: Infinity, duration: 2 }}
						>
							<Flame
								size={compact ? 24 : 32}
								style={{
									color:
										currentStreak >= 7
											? "var(--color-warning)"
											: "var(--color-text-secondary)",
								}}
							/>
						</motion.div>
						<p
							className="text-[10px] font-medium"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("practice.streak_days", { n: currentStreak })}
						</p>
					</div>
				)}

				{/* Session stars */}
				{sessionStars > 0 && (
					<div className="flex flex-col items-center gap-1">
						<div className="flex gap-0.5">
							{Array.from({ length: sessionStars }).map((_, i) => (
								<motion.div
									key={`star-${i}`}
									initial={{ scale: 0, rotate: -180 }}
									animate={{ scale: 1, rotate: 0 }}
									transition={{ delay: i * 0.15, type: "spring" }}
								>
									<Star
										size={compact ? 16 : 20}
										fill="var(--color-warning)"
										style={{ color: "var(--color-warning)" }}
									/>
								</motion.div>
							))}
						</div>
						<p
							className="text-[10px] font-medium"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("practice.blocks_stars", { n: sessionStars })}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

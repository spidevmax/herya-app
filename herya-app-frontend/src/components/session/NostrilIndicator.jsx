import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Visual indicator for alternate-nostril breathing (Nadi Shodhana / Surya Bhedana).
 * Shows which nostril is active in the current cycle with a simple nose diagram.
 *
 * @param {"left"|"right"} activeNostril - Which nostril is active now
 * @param {string} phaseKey - Current breathing phase
 * @param {string} color - Accent colour for the active side
 */
export default function NostrilIndicator({
	activeNostril = "left",
	phaseKey,
	color = "var(--color-secondary)",
}) {
	const { t } = useLanguage();
	const isLeft = activeNostril === "left";

	return (
		<figure
			className="flex flex-col items-center gap-1 m-0"
			aria-label={t(
				isLeft ? "pranayama.nostril_left" : "pranayama.nostril_right",
			)}
		>
			<svg
				width="48"
				height="56"
				viewBox="0 0 48 56"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				{/* Nose bridge */}
				<path
					d="M24 4 C24 4, 20 20, 16 36 C14 42, 16 48, 20 50 C22 51, 26 51, 28 50 C32 48, 34 42, 32 36 C28 20, 24 4, 24 4Z"
					fill="var(--color-surface-card)"
					stroke="var(--color-border-soft)"
					strokeWidth="1.5"
				/>

				{/* Left nostril */}
				<motion.ellipse
					cx="17"
					cy="46"
					rx="5"
					ry="4"
					animate={{
						fill: isLeft ? color : "var(--color-border-soft)",
						opacity: isLeft ? 1 : 0.3,
						scale: isLeft && phaseKey === "inhale" ? 1.15 : 1,
					}}
					transition={{ duration: 0.4, ease: "easeInOut" }}
					stroke="var(--color-border)"
					strokeWidth="1"
				/>

				{/* Right nostril */}
				<motion.ellipse
					cx="31"
					cy="46"
					rx="5"
					ry="4"
					animate={{
						fill: !isLeft ? color : "var(--color-border-soft)",
						opacity: !isLeft ? 1 : 0.3,
						scale: !isLeft && phaseKey === "inhale" ? 1.15 : 1,
					}}
					transition={{ duration: 0.4, ease: "easeInOut" }}
					stroke="var(--color-border)"
					strokeWidth="1"
				/>

				{/* Air flow indicators */}
				{phaseKey === "inhale" && (
					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						exit={{ opacity: 0 }}
					>
						{/* Upward arrow on active side */}
						<motion.path
							d={
								isLeft
									? "M17 40 L17 32 M14 35 L17 32 L20 35"
									: "M31 40 L31 32 M28 35 L31 32 L34 35"
							}
							stroke={color}
							strokeWidth="1.5"
							strokeLinecap="round"
							fill="none"
							animate={{ y: [0, -2, 0] }}
							transition={{ duration: 1.5, repeat: Infinity }}
						/>
					</motion.g>
				)}
				{phaseKey === "exhale" && (
					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						exit={{ opacity: 0 }}
					>
						{/* Downward arrow on active side */}
						<motion.path
							d={
								isLeft
									? "M17 50 L17 58 M14 55 L17 58 L20 55"
									: "M31 50 L31 58 M28 55 L31 58 L34 55"
							}
							stroke={color}
							strokeWidth="1.5"
							strokeLinecap="round"
							fill="none"
							animate={{ y: [0, 2, 0] }}
							transition={{ duration: 1.5, repeat: Infinity }}
						/>
					</motion.g>
				)}
			</svg>

			<figcaption
				className="text-[10px] font-semibold uppercase"
				style={{ color }}
			>
				{t(
					isLeft ? "pranayama.nostril_left" : "pranayama.nostril_right",
				)}
			</figcaption>
		</figure>
	);
}

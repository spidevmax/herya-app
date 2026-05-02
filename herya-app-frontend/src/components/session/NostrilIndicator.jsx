import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Visual indicator for alternate-nostril breathing (Nadi Shodhana / Surya Bhedana).
 * Shows which nostril is active in the current cycle with a simple nose diagram.
 *
 * @param {"left"|"right"|"both"|"none"} nostrilFlow - Which nostril(s) carry airflow now
 * @param {string} phaseKey - Current breathing phase
 * @param {string} color - Accent colour for the active side
 */
export default function NostrilIndicator({
	nostrilFlow = "left",
	phaseKey,
	color = "var(--color-secondary)",
}) {
	const { t } = useLanguage();
	const isLeft = nostrilFlow === "left";
	const isRight = nostrilFlow === "right";
	const isBoth = nostrilFlow === "both";
	const hasAirflow = isLeft || isRight || isBoth;
	const leftActive = isLeft || isBoth;
	const rightActive = isRight || isBoth;
	const label =
		nostrilFlow === "both"
			? "Both nostrils"
			: nostrilFlow === "none"
				? t("pranayama.hold")
				: t(isLeft ? "pranayama.nostril_left" : "pranayama.nostril_right");

	return (
		<figure className="flex flex-col items-center gap-1 m-0" aria-label={label}>
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
						fill: leftActive ? color : "var(--color-border-soft)",
						opacity: leftActive ? 1 : 0.3,
						scale: leftActive && phaseKey === "inhale" ? 1.15 : 1,
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
						fill: rightActive ? color : "var(--color-border-soft)",
						opacity: rightActive ? 1 : 0.3,
						scale: rightActive && phaseKey === "inhale" ? 1.15 : 1,
					}}
					transition={{ duration: 0.4, ease: "easeInOut" }}
					stroke="var(--color-border)"
					strokeWidth="1"
				/>

				{/* Air flow indicators */}
				{phaseKey === "inhale" && hasAirflow && (
					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						exit={{ opacity: 0 }}
					>
						{leftActive && (
							<motion.path
								d="M17 40 L17 32 M14 35 L17 32 L20 35"
								stroke={color}
								strokeWidth="1.5"
								strokeLinecap="round"
								fill="none"
								animate={{ y: [0, -2, 0] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							/>
						)}
						{rightActive && (
							<motion.path
								d="M31 40 L31 32 M28 35 L31 32 L34 35"
								stroke={color}
								strokeWidth="1.5"
								strokeLinecap="round"
								fill="none"
								animate={{ y: [0, -2, 0] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							/>
						)}
					</motion.g>
				)}
				{phaseKey === "exhale" && hasAirflow && (
					<motion.g
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						exit={{ opacity: 0 }}
					>
						{leftActive && (
							<motion.path
								d="M17 50 L17 58 M14 55 L17 58 L20 55"
								stroke={color}
								strokeWidth="1.5"
								strokeLinecap="round"
								fill="none"
								animate={{ y: [0, 2, 0] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							/>
						)}
						{rightActive && (
							<motion.path
								d="M31 50 L31 58 M28 55 L31 58 L34 55"
								stroke={color}
								strokeWidth="1.5"
								strokeLinecap="round"
								fill="none"
								animate={{ y: [0, 2, 0] }}
								transition={{ duration: 1.5, repeat: Infinity }}
							/>
						)}
					</motion.g>
				)}
			</svg>

			<figcaption
				className="text-[10px] font-semibold uppercase"
				style={{ color }}
			>
				{label}
			</figcaption>
		</figure>
	);
}

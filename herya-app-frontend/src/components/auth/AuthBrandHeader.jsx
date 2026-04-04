import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function AuthBrandHeader({
	compact = false,
	showSubtitle = true,
	subtitleKey = "login.subtitle",
}) {
	const { t } = useLanguage();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35 }}
			className={`mb-5 flex flex-col items-center text-center ${compact ? "gap-2" : "gap-3"}`}
		>
			<div
				className={`relative flex items-center justify-center rounded-[1.35rem] shadow-[var(--shadow-card)] ${compact ? "h-14 w-14" : "h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem]"}`}
				style={{
					background:
						"linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
				}}
			>
				<div className="absolute inset-2 rounded-[1rem] border border-white/20" />
				<div className="absolute -right-2 top-1 h-4 w-4 rounded-full bg-white/20 blur-[1px]" />
				<div className="absolute -left-1 bottom-1 h-3 w-3 rounded-full bg-white/15 blur-[1px]" />
				<img
					src="/android-chrome-512x512.png"
					alt="Herya logo"
					className="relative h-14 w-14 rounded-[1rem] object-cover sm:h-16 sm:w-16"
				/>
			</div>

			<h1
				className={`font-semibold tracking-[-0.04em] text-[var(--color-primary)] ${compact ? "text-[1.7rem]" : "text-[2rem] sm:text-[2.15rem]"}`}
			>
				Herya
			</h1>
			{showSubtitle && (
				<p
					className={`max-w-[20rem] text-sm font-medium leading-6 ${compact ? "mt-0" : "mt-1"}`}
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t(subtitleKey)}
				</p>
			)}
		</motion.div>
	);
}

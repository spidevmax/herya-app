import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Sparkles, Wind, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const PostPracticeNudge = ({ durationMinutes = 0, stressAfter = null }) => {
	const { t } = useLanguage();
	const [visible, setVisible] = useState(true);

	const nudge = useMemo(() => {
		if ((stressAfter ?? 0) >= 7) {
			return {
				icon: Wind,
				message: t("practice.post_nudge_breathe"),
				accent: "var(--surya)",
				bg: "var(--surya)",
			};
		}

		if (durationMinutes >= 25) {
			return {
				icon: Droplets,
				message: t("practice.post_nudge_hydrate"),
				accent: "var(--chandra)",
				bg: "var(--chandra)",
			};
		}

		return {
			icon: Sparkles,
			message: t("practice.post_nudge_return"),
			accent: "var(--surya)",
			bg: "var(--surya)",
		};
	}, [durationMinutes, stressAfter, t]);

	if (!visible) return null;

	const Icon = nudge.icon;

	return (
		<AnimatePresence>
			<motion.aside
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				className="rounded-2xl p-4 border"
				style={{
					background: nudge.bg,
					borderColor: "var(--ink)",
				}}
				aria-label={t("practice.post_nudge_label")}
			>
				<div className="flex items-start gap-3">
					<div
						className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
						style={{ backgroundColor: "var(--paper-raised)" }}
					>
						<Icon size={16} style={{ color: nudge.accent }} />
					</div>
					<div className="flex-1">
						<p
							className="text-[10px] font-bold mb-1"
							/*
							 * --on-fill, no --ink-soft. El aviso se rellena con surya o
							 * chandra, y esos dos colores se quedan claros en los dos
							 * temas: --ink-soft encima era gris palido sobre naranja.
							 *
							 * Sin opacidad: atenuarlo al 75% lo dejaba en 3.41 sobre
							 * chandra, por debajo del minimo. La jerarquia la dan el
							 * tamano y el grosor.
							 */
							style={{ color: "var(--on-fill)" }}
						>
							{t("practice.post_nudge_label")}
						</p>
						<p
							className="text-sm font-semibold"
							style={{ color: "var(--on-fill)" }}
						>
							{nudge.message}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setVisible(false)}
						className="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-black/5"
						aria-label={t("practice.dismiss_nudge")}
					>
						<X size={14} style={{ color: "var(--on-fill)" }} />
					</button>
				</div>
			</motion.aside>
		</AnimatePresence>
	);
};

export default PostPracticeNudge;

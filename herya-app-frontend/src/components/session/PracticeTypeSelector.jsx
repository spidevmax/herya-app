import { motion } from "framer-motion";
import { Sparkles, Wind, Brain, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const PRACTICE_TYPES = [
	{
		value: "vk_sequence",
		icon: Sparkles,
		color: "var(--color-primary)",
		bgColor: "var(--color-primary)",
	},
	{
		value: "pranayama",
		icon: Wind,
		color: "var(--color-secondary)",
		bgColor: "var(--color-secondary)",
	},
	{
		value: "meditation",
		icon: Brain,
		color: "var(--color-accent)",
		bgColor: "var(--color-accent)",
	},
	{
		value: "complete_practice",
		icon: Star,
		color: "var(--color-warning)",
		bgColor: "var(--color-warning)",
	},
];

export default function PracticeTypeSelector({ onSelect }) {
	const { t } = useLanguage();

	return (
		<section aria-label={t("practice.select_type_title")} className="flex flex-col gap-6 pt-4">
			<header className="text-center">
				<h2 className="text-2xl font-semibold mb-2 text-[var(--color-text-primary)]">
					{t("practice.select_type_title")}
				</h2>
				<p
					className="text-sm"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("practice.select_type_subtitle")}
				</p>
			</header>

			<div className="grid grid-cols-2 gap-3">
				{PRACTICE_TYPES.map((type, i) => {
					const Icon = type.icon;
					return (
						<motion.button
							key={type.value}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.08 }}
							whileHover={{ y: -2 }}
							whileTap={{ scale: 0.97 }}
							onClick={() => onSelect(type.value)}
							className="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all"
							style={{
								backgroundColor: "var(--color-surface-card)",
								borderColor: "var(--color-border-soft)",
							}}
						>
							<div
								className="w-14 h-14 rounded-2xl flex items-center justify-center"
								style={{ backgroundColor: `${type.color}15` }}
							>
								<Icon
									size={28}
									strokeWidth={2}
									style={{ color: type.color }}
								/>
							</div>
							<div className="text-center">
								<p
									className="text-sm font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t(`practice.type_${type.value}`)}
								</p>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--color-text-muted)" }}
								>
									{t(`practice.type_${type.value}_desc`)}
								</p>
							</div>
						</motion.button>
					);
				})}
			</div>
		</section>
	);
}

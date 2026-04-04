import { motion } from "framer-motion";
import { BookOpen, Leaf, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const ACTIONS = [
	{
		key: "library",
		labelKey: "nav.library",
		icon: BookOpen,
		color: "var(--color-info)",
		bg: "color-mix(in srgb, var(--color-info) 14%, var(--color-surface-card))",
		border: "color-mix(in srgb, var(--color-info) 28%, transparent)",
		to: "/library",
	},
	{
		key: "garden",
		labelKey: "dashboard.quick_garden",
		icon: Leaf,
		color: "var(--color-success)",
		bg: "color-mix(in srgb, var(--color-success) 14%, var(--color-surface-card))",
		border: "color-mix(in srgb, var(--color-success) 28%, transparent)",
		to: "/garden",
	},
	{
		key: "pranayama",
		labelKey: "fab.pranayama",
		icon: Wind,
		color: "var(--color-warning)",
		bg: "color-mix(in srgb, var(--color-warning) 16%, var(--color-surface-card))",
		border: "color-mix(in srgb, var(--color-warning) 30%, transparent)",
		to: "/session/pranayama",
	},
];

/** Reorder quick actions based on user preferences — no new data required. */
const getOrderedActions = (user) => {
	const timeOfDay = user?.preferences?.timeOfDay;
	const goals = Array.isArray(user?.goals) ? user.goals : [];
	const wantsMeditation =
		goals.includes("breath_awareness") || goals.includes("meditation_focus");

	if (timeOfDay === "morning" || wantsMeditation) {
		return [
			...ACTIONS.filter((a) => a.key === "pranayama"),
			...ACTIONS.filter((a) => a.key !== "pranayama"),
		];
	}
	return ACTIONS;
};

export default function QuickActions({ user }) {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const actions = getOrderedActions(user);

	return (
		<div className="px-4 sm:px-6">
			<div className="grid grid-cols-3 gap-2">
				{actions.map((a, i) => {
					const Icon = a.icon;
					return (
						<motion.button
							key={a.key}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.07 }}
							whileTap={{ scale: 0.93 }}
							onClick={() => navigate(a.to)}
							className="flex flex-col items-center gap-2 py-3 rounded-2xl border"
							style={{ background: a.bg, borderColor: a.border }}
						>
							<Icon size={22} style={{ color: a.color }} strokeWidth={1.8} />
							<span
								className="text-[12px] font-semibold"
								style={{ color: a.color }}
							>
								{t(a.labelKey)}
							</span>
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}

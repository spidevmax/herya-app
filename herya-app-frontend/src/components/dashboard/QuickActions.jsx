import { motion } from "framer-motion";
import { BookOpen, Leaf, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const ACTIONS = [
	{
		key: "library",
		labelKey: "nav.library",
		icon: BookOpen,
		color: "#4A72FF",
		bg: "#4A72FF15",
		to: "/library",
	},
	{
		key: "garden",
		labelKey: "dashboard.quick_garden",
		icon: Leaf,
		color: "#5DB075",
		bg: "#5DB07515",
		to: "/garden",
	},
	{
		key: "pranayama",
		labelKey: "fab.pranayama",
		icon: Wind,
		color: "#9B5DE5",
		bg: "#9B5DE515",
		to: "/session/pranayama",
	},
];

/** Reorder quick actions based on user preferences — no new data required. */
function getOrderedActions(user) {
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
}

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
							className="flex flex-col items-center gap-2 py-3 rounded-2xl"
							style={{ backgroundColor: a.bg }}
						>
							<Icon size={22} style={{ color: a.color }} strokeWidth={1.8} />
							<span
								className="text-[11px] font-semibold"
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

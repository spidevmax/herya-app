import { motion } from "framer-motion";
import { BookOpen, Leaf, Play, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACTIONS = [
	{
		label: "Library",
		icon: BookOpen,
		color: "#4A72FF",
		bg: "#4A72FF15",
		to: "/library",
	},
	{
		label: "Garden",
		icon: Leaf,
		color: "#5DB075",
		bg: "#5DB07515",
		to: "/garden",
	},
	{
		label: "Pranayama",
		icon: Wind,
		color: "#9B5DE5",
		bg: "#9B5DE515",
		to: "/session/pranayama",
	},
	{
		label: "Practice",
		icon: Play,
		color: "#FFB347",
		bg: "#FFB34715",
		to: "/session/complete_practice",
	},
];

export default function QuickActions() {
	const navigate = useNavigate();
	return (
		<div>
			<h3 className="text-sm font-bold text-[#6B7280] mb-3 px-4 uppercase tracking-wider">
				Quick Start
			</h3>
			<div className="grid grid-cols-4 gap-2 px-4">
				{ACTIONS.map((a, i) => {
					const Icon = a.icon;
					return (
						<motion.button
							key={a.to}
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
								{a.label}
							</span>
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}

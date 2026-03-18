import { motion } from "framer-motion";
import { ArrowRight, Clock, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LEVEL_LABELS, VK_FAMILY_MAP } from "../../utils/constants";
import { Button } from "../ui";

export default function HeroCard({ sequence, loading }) {
	const navigate = useNavigate();

	if (loading) return <div className="mx-4 rounded-3xl h-52 skeleton" />;

	if (!sequence) {
		return (
			<div className="mx-4 rounded-3xl bg-gradient-to-br from-[#4A72FF] to-[#7B9FFF] p-6 text-white">
				<h2 className="font-display text-2xl font-bold mb-2">Welcome! 🧘</h2>
				<p className="text-white/80 text-sm mb-4">
					Start your first VK session to get personalised recommendations.
				</p>
				<Button
					variant="ghost"
					className="text-white border border-white/40 hover:bg-white/20"
					onClick={() => navigate("/library")}
				>
					Explore Library <ArrowRight size={16} />
				</Button>
			</div>
		);
	}

	const family = VK_FAMILY_MAP[sequence.family] || {
		color: "#4A72FF",
		emoji: "🧘",
		label: sequence.family,
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96 }}
			animate={{ opacity: 1, scale: 1 }}
			className="mx-4 rounded-3xl overflow-hidden cursor-pointer"
			onClick={() => navigate("/library/sequence/" + sequence._id)}
			whileTap={{ scale: 0.98 }}
		>
			<div
				className="p-6 relative overflow-hidden"
				style={{
					background:
						"linear-gradient(135deg, " +
						family.color +
						", " +
						family.color +
						"CC)",
				}}
			>
				<div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-20 float select-none pointer-events-none">
					{family.emoji}
				</div>
				<span className="inline-flex items-center gap-1 text-xs font-bold text-white/80 uppercase tracking-widest mb-3">
					✨ Recommended for you
				</span>
				<h2 className="font-display text-2xl font-bold text-white leading-tight mb-1">
					{sequence.englishName}
				</h2>
				<p className="text-white/80 text-xs font-medium italic mb-4">
					{sequence.sanskritName}
				</p>
				<div className="flex items-center gap-3 mb-5">
					{sequence.estimatedDuration?.recommended && (
						<div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1">
							<Clock size={13} className="text-white/80" />
							<span className="text-white text-xs font-semibold">
								{sequence.estimatedDuration.recommended} min
							</span>
						</div>
					)}
					<div className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1">
						<Dumbbell size={13} className="text-white/80" />
						<span className="text-white text-xs font-semibold">
							{LEVEL_LABELS[sequence.level] ?? sequence.difficulty}
						</span>
					</div>
				</div>
				<button
					className="flex items-center gap-2 bg-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg"
					style={{ color: family.color }}
					onClick={(e) => {
						e.stopPropagation();
						navigate("/session/vk_sequence?seq=" + sequence._id);
					}}
				>
					Start Practice <ArrowRight size={16} />
				</button>
			</div>
		</motion.div>
	);
}

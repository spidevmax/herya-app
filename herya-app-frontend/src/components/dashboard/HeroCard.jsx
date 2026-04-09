import { motion } from "framer-motion";
import { ArrowRight, Clock, Dumbbell, PersonStanding } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { LEVEL_LABELS, VK_FAMILY_MAP } from "@/utils/constants";

const HeroCard = ({ sequence, reason, loading }) => {
	const navigate = useNavigate();
	const { t } = useLanguage();

	if (loading)
		return <div className="mx-4 lg:mx-0 rounded-3xl h-52 skeleton" />;

	if (!sequence) {
		return (
			<div
				className="mx-4 lg:mx-0 rounded-3xl p-6 text-white"
				style={{
					background:
						"linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
				}}
			>
				<h2
					className="text-2xl font-semibold mb-2"

				>
					{t("dashboard.welcome_title")}
				</h2>
				<p className="text-white/80 text-sm font-medium mb-4">
					{t("hero.welcome_hint")}
				</p>
				<Button
					variant="ghost"
					className="text-white border border-white/40 hover:bg-white/20"
					onClick={() => navigate("/library")}
				>
					{t("hero.explore")} <ArrowRight size={16} />
				</Button>
			</div>
		);
	}

	const family = VK_FAMILY_MAP[sequence.family] || {
		color: "var(--color-primary)",
		emoji: null,
		label: sequence.family,
	};
	const heroColorStart = `color-mix(in srgb, ${family.color} 58%, var(--color-primary-dark))`;
	const heroColorEnd = `color-mix(in srgb, ${family.color} 42%, var(--color-primary))`;
	const recommendedMinutes = Number(sequence.estimatedDuration?.recommended);
	const handleCardClick = () => navigate(`/library/sequence/${sequence._id}`);
	const handleCardKeyDown = (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleCardClick();
		}
	};

	return (
		<motion.div
			className="mx-4 lg:mx-0 rounded-3xl overflow-hidden cursor-pointer"
			onClick={handleCardClick}
			onKeyDown={handleCardKeyDown}
			role="button"
			tabIndex={0}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ duration: 0.25 }}
		>
			<div
				className="p-6 relative overflow-hidden"
				style={{
					background: `linear-gradient(135deg, ${heroColorStart}, ${heroColorEnd})`,
				}}
			>
				<div className="absolute inset-0 pointer-events-none bg-black/10" />
				<div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 float select-none pointer-events-none">
					{family.emoji ? (
						<span className="text-8xl">{family.emoji}</span>
					) : (
						<PersonStanding
							size={88}
							strokeWidth={1.8}
							className="text-white"
						/>
					)}
				</div>
				<span className="relative inline-flex items-center gap-1 text-xs font-medium text-white/85 uppercase tracking-widest mb-1">
					{t("dashboard.recommended")}
				</span>
				{reason ? (
					<p className="relative text-white/70 text-[11px] mb-2 italic">
						{reason}
					</p>
				) : (
					<div className="mb-2" />
				)}
				<h2
					className="relative text-2xl font-semibold text-white leading-tight mb-1"

				>
					{sequence.englishName}
				</h2>
				<p className="relative text-white/80 text-xs font-medium italic mb-4">
					{sequence.sanskritName}
				</p>
				<div className="relative flex items-center gap-3 mb-5">
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
					type="button"
					className="relative flex items-center gap-2 bg-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-lg"
					style={{ color: "var(--color-text-primary)" }}
					onClick={(e) => {
						e.stopPropagation();
						const params = new URLSearchParams({
							type: "vk_sequence",
							seq: sequence._id,
						});
						if (Number.isFinite(recommendedMinutes) && recommendedMinutes > 0) {
							params.set("minutes", String(Math.round(recommendedMinutes)));
						}
						navigate(`/start-practice?${params.toString()}`);
					}}
				>
					{t("hero.start")} <ArrowRight size={16} />
				</button>
			</div>
		</motion.div>
	);
};

export default HeroCard;

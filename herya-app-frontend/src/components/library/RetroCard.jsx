import { motion } from "framer-motion";
import { PersonStanding } from "lucide-react";
import {
	getPalette,
	getCardTitle,
	getCardSubtitle,
	getMonogram,
	getSequencePoseCount,
	colorMix,
	translateWithFallback,
	localized,
} from "@/utils/libraryHelpers";
import { useLanguage } from "@/context/LanguageContext";

const StatBox = ({ value, label, bg, color }) => (
	<div
		className="flex min-w-[44px] flex-col items-center justify-center rounded-xl px-2 py-1.5"
		style={{ backgroundColor: bg }}
	>
		<span
			className="font-display text-sm font-bold leading-none"
			style={{ color }}
		>
			{value}
		</span>
		<span
			className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
			style={{ color }}
		>
			{label}
		</span>
	</div>
);

const RetroCard = ({ item, type, onClick, typeLabel, fallbackItemLabel }) => {
	const { t, lang } = useLanguage();
	const tr = (key, fallback) => translateWithFallback(t, key, fallback);

	const palette = getPalette(item, type);
	const borderColor = palette.border;
	const title = getCardTitle(item, fallbackItemLabel, lang);
	const subtitle = getCardSubtitle(item);
	const monogram = getMonogram(title) || typeLabel.slice(0, 2).toUpperCase();
	const imageSrc =
		item.image || item.media?.thumbnail?.url || item.media?.images?.[0]?.url;

	const translateDifficulty = (d) => d ? tr(`library.${d}`, d) : "—";
	const translateFamily = (f) => f ? tr(`library.families.${f}`, String(f).replace(/_/g, " ")) : "—";
	const translateCategory = (c) => {
		if (!c) return "—";
		const cat = Array.isArray(c) ? c[0] : c;
		return cat ? tr(`library.categories.${cat}`, String(cat).replace(/_/g, " ")) : "—";
	};
	const translateEffect = (e) => e ? tr(`library.effects.${e}`, e) : "—";
	const translateDrishti = (d) => d ? tr(`library.drishti.${d}`, String(d).replace(/_/g, " ")) : "—";

	const formatRatio = (ratio) => {
		if (!ratio || typeof ratio !== "object") return "—";
		const { inhale = 0, hold = 0, exhale = 0, holdAfterExhale = 0 } = ratio;
		if (!inhale && !hold && !exhale && !holdAfterExhale) return "—";
		return `${inhale}:${hold}:${exhale}:${holdAfterExhale}`;
	};

	const formatDuration = (minutes) => {
		const n = Number(minutes);
		if (!Number.isFinite(n) || n <= 0) return null;
		return `${n}m`;
	};

	const buildSequenceStats = () => {
		const base = [
			{ value: tr(`library.level_${item.level}`, item.level ?? "—"), label: tr("library.stat_level", "LEVEL") },
			{ value: translateFamily(item.family), label: tr("library.stat_family", "FAMILY") },
			{ value: getSequencePoseCount(item) ?? "—", label: tr("library.stat_poses", "POSES") },
			{ value: translateDifficulty(item.difficulty), label: tr("library.stat_difficulty", "DIFF") },
		];
		const duration = formatDuration(item.duration ?? item.estimatedDuration);
		if (duration) base.push({ value: duration, label: tr("library.stat_duration", "TIME") });
		return base;
	};

	const stats =
		type === "sequences"
			? buildSequenceStats()
			: type === "poses"
				? [
						{
							value: translateDifficulty(item.difficulty),
							label: tr("library.stat_level", "LEVEL"),
						},
						{
							value: translateCategory(item.poseType ?? item.category),
							label: tr("library.stat_type", "TYPE"),
						},
						{
							value: translateDrishti(item.drishti),
							label: tr("library.stat_drishti", "GAZE"),
						},
					]
				: [
						{
							value: translateEffect(item.energyEffect),
							label: tr("library.stat_effect", "EFFECT"),
						},
						{
							value: translateCategory(item.breathType ?? item.category),
							label: tr("library.stat_type", "TYPE"),
						},
						{
							value: formatRatio(item.patternRatio),
							label: tr("library.stat_ratio", "RATIO"),
						},
						{
							value: translateDifficulty(item.difficulty),
							label: tr("library.stat_difficulty", "DIFF"),
						},
					];

	return (
		<motion.button
			type="button"
			onClick={onClick}
			whileHover={{ y: -3, scale: 1.01 }}
			whileTap={{ scale: 0.985 }}
			className="relative w-full overflow-hidden rounded-[28px] text-left transition-shadow duration-200"
			style={{ boxShadow: "0 14px 0 rgba(0,0,0,0.08)" }}
		>
			<div
				className="overflow-hidden rounded-[28px] border-4"
				style={{ backgroundColor: palette.bg, borderColor }}
			>
				<div className="flex items-stretch">
					<figure
						className="flex shrink-0 items-center justify-center m-0"
						style={{
							width: 88,
							minHeight: 88,
							backgroundColor: colorMix(borderColor, 9),
							borderRight: `3px solid ${borderColor}`,
						}}
					>
						{imageSrc ? (
							<img
								src={imageSrc}
								alt={title}
								className="h-full w-full object-cover"
							/>
						) : (
							<div
								className="font-display flex h-full w-full items-center justify-center text-2xl font-black"
								style={{ color: borderColor }}
								aria-hidden="true"
							>
								{monogram || (
									<PersonStanding size={28} style={{ color: borderColor }} />
								)}
							</div>
						)}
					</figure>

					<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
						<header className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<span
									className="text-[10px] font-black uppercase tracking-[0.12em]"
									style={{ color: borderColor }}
								>
									{typeLabel}
								</span>
								<h3
									className="truncate text-base font-black leading-tight"
									style={{ color: borderColor }}
								>
									{title}
								</h3>
							</div>
						</header>
						{subtitle && subtitle !== title && (
							<p
								className="truncate text-xs font-medium italic"
								style={{ color: colorMix(borderColor, 73) }}
							>
								{subtitle}
							</p>
						)}
						{(localized(item, "description", lang) || item.description) && (
							<p
								className="mt-1 line-clamp-2 text-xs leading-snug"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{localized(item, "description", lang)}
							</p>
						)}
					</div>
				</div>

				<footer
					className="flex items-center justify-between gap-2 px-3 py-2"
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: colorMix(borderColor, 7),
					}}
				>
					<ul className="flex flex-wrap gap-1.5 list-none m-0 p-0">
						{stats.map((stat) => (
							<li key={stat.label}>
								<StatBox
									value={stat.value}
									label={stat.label}
									bg={palette.statBg}
									color={borderColor}
								/>
							</li>
						))}
					</ul>
				</footer>
			</div>
		</motion.button>
	);
};

export default RetroCard;

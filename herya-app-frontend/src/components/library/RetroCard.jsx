import { motion } from "framer-motion";
import { PersonStanding } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
	colorMix,
	DIFF_COLORS,
	getCardSubtitle,
	getCardTitle,
	getMonogram,
	getPalette,
	getSequencePoseCount,
	localized,
	translateWithFallback,
} from "@/utils/libraryHelpers";

const StatBox = ({ value, label, bg, color }) => (
	<div
		className="flex h-full min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5"
		style={{ backgroundColor: bg }}
		title={typeof value === "string" ? value : undefined}
	>
		<span
			className="block w-full truncate text-center font-display text-sm font-bold leading-none"
			style={{ color }}
		>
			{value}
		</span>
		<span
			className="mt-0.5 block w-full truncate text-center text-[9px] font-black uppercase tracking-[0.12em]"
			style={{ color }}
		>
			{label}
		</span>
	</div>
);

const DifficultyBadge = ({ difficulty, label }) => {
	const tone = DIFF_COLORS[difficulty] || "var(--color-text-muted)";
	return (
		<span
			className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
			style={{
				backgroundColor: colorMix(tone, 18),
				color: tone,
				border: `1px solid ${colorMix(tone, 40)}`,
			}}
			aria-hidden="true"
		>
			{label}
		</span>
	);
};

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

	const translateDifficulty = (d) => (d ? tr(`library.${d}`, d) : "—");
	const translateFamily = (f) =>
		f ? tr(`library.families.${f}`, String(f).replace(/_/g, " ")) : "—";
	const translateCategory = (c) => {
		if (!c) return "—";
		const cat = Array.isArray(c) ? c[0] : c;
		return cat
			? tr(`library.categories.${cat}`, String(cat).replace(/_/g, " "))
			: "—";
	};
	const translateEffect = (e) => (e ? tr(`library.effects.${e}`, e) : "—");
	const translateDrishti = (d) =>
		d ? tr(`library.drishti.${d}`, String(d).replace(/_/g, " ")) : "—";

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
			{
				value: tr(`library.level_${item.level}`, item.level ?? "—"),
				label: tr("library.stat_level", "LEVEL"),
			},
			{
				value: translateFamily(item.family),
				label: tr("library.stat_family", "FAMILY"),
			},
			{
				value: getSequencePoseCount(item) ?? "—",
				label: tr("library.stat_poses", "POSES"),
			},
		];
		const duration = formatDuration(item.duration ?? item.estimatedDuration);
		if (duration)
			base.push({
				value: duration,
				label: tr("library.stat_duration", "TIME"),
			});
		return base;
	};

	const stats =
		type === "sequences"
			? buildSequenceStats()
			: type === "poses"
				? [
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
					];

	const difficultyLabel = item.difficulty
		? translateDifficulty(item.difficulty)
		: null;

	const ariaLabel = [
		typeLabel,
		title,
		difficultyLabel
			? `${tr("library.stat_difficulty", "Difficulty")}: ${difficultyLabel}`
			: null,
	]
		.filter(Boolean)
		.join(" — ");

	return (
		<motion.button
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
			whileHover={{ y: -3, scale: 1.01 }}
			whileTap={{ scale: 0.985 }}
			className="group relative flex h-full w-full overflow-hidden rounded-[28px] text-left cursor-pointer transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
			style={{
				boxShadow: "0 14px 0 rgba(0,0,0,0.08)",
				"--tw-ring-color": borderColor,
			}}
		>
			<div
				className="flex flex-1 flex-col overflow-hidden rounded-[28px] border-4 transition-shadow duration-200 group-hover:shadow-[0_16px_24px_rgba(0,0,0,0.12)]"
				style={{ backgroundColor: palette.bg, borderColor }}
			>
				<div className="flex flex-1 items-stretch">
					<figure
						className="flex shrink-0 items-center justify-center m-0 overflow-hidden"
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
								alt=""
								loading="lazy"
								decoding="async"
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-2 mb-0.5">
									<span
										className="truncate text-[10px] font-black uppercase tracking-[0.12em]"
										style={{ color: borderColor }}
									>
										{typeLabel}
									</span>
									{difficultyLabel ? (
										<DifficultyBadge
											difficulty={item.difficulty}
											label={difficultyLabel}
										/>
									) : null}
								</div>
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
					className="mt-auto flex items-center justify-between gap-2 px-3 py-2"
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: colorMix(borderColor, 7),
					}}
				>
					<ul className="flex flex-nowrap items-stretch gap-1.5 list-none m-0 p-0 overflow-hidden w-full">
						{stats.map((stat) => (
							<li key={stat.label} className="min-w-0 flex-1">
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

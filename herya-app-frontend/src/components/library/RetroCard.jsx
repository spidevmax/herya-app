import { motion } from "framer-motion";
import { PersonStanding } from "lucide-react";
import {
	getPalette,
	getCardTitle,
	getCardSubtitle,
	getMonogram,
	getSequencePoseCount,
	colorMix,
} from "@/utils/libraryHelpers";
import { useLanguage } from "@/context/LanguageContext";
import { translateWithFallback } from "@/utils/libraryHelpers";

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
	const { t } = useLanguage();
	const tr = (key, fallback) => translateWithFallback(t, key, fallback);

	const palette = getPalette(item, type);
	const borderColor = palette.border;
	const title = getCardTitle(item, fallbackItemLabel);
	const subtitle = getCardSubtitle(item);
	const monogram = getMonogram(title) || typeLabel.slice(0, 2).toUpperCase();
	const imageSrc =
		item.image || item.media?.thumbnail?.url || item.media?.images?.[0]?.url;

	const stats =
		type === "sequences"
			? [
					{ value: item.level ?? "—", label: tr("library.stat_level", "LEVEL") },
					{
						value: item.family
							? String(item.family).replace(/_/g, " ").toUpperCase()
							: "—",
						label: tr("library.stat_family", "FAMILY"),
					},
					{
						value: getSequencePoseCount(item) ?? "—",
						label: tr("library.stat_poses", "POSES"),
					},
				]
			: type === "poses"
				? [
						{
							value: item.difficulty ?? "—",
							label: tr("library.stat_level", "LEVEL"),
						},
						{
							value: item.poseType ?? item.category ?? "—",
							label: tr("library.stat_type", "TYPE"),
						},
					]
				: [
						{
							value: item.energyEffect ?? "—",
							label: tr("library.stat_effect", "EFFECT"),
						},
						{
							value: item.breathType ?? item.category ?? "—",
							label: tr("library.stat_type", "TYPE"),
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
					<div
						className="flex shrink-0 items-center justify-center"
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
							>
								{monogram || (
									<PersonStanding size={28} style={{ color: borderColor }} />
								)}
							</div>
						)}
					</div>

					<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<p
									className="text-[10px] font-black uppercase tracking-[0.12em]"
									style={{ color: borderColor }}
								>
									{typeLabel}
								</p>
								<h3
									className="truncate text-base font-black leading-tight"
									style={{ color: borderColor }}
								>
									{title}
								</h3>
							</div>
						</div>
						{subtitle && subtitle !== title && (
							<p
								className="truncate text-xs font-medium italic"
								style={{ color: colorMix(borderColor, 73) }}
							>
								{subtitle}
							</p>
						)}
						{item.description && (
							<p
								className="mt-1 line-clamp-2 text-xs leading-snug"
								style={{ color: "var(--color-text-secondary)" }}
							>
								{item.description}
							</p>
						)}
					</div>
				</div>

				<div
					className="flex items-center justify-between gap-2 px-3 py-2"
					style={{
						borderTop: `3px solid ${borderColor}`,
						backgroundColor: colorMix(borderColor, 7),
					}}
				>
					<div className="flex flex-wrap gap-1.5">
						{stats.map((stat) => (
							<StatBox
								key={stat.label}
								value={stat.value}
								label={stat.label}
								bg={palette.statBg}
								color={borderColor}
							/>
						))}
					</div>
				</div>
			</div>
		</motion.button>
	);
};

export default RetroCard;

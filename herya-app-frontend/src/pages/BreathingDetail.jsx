import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	ChevronLeft,
	Flame,
	Frown,
	Scale,
	Snowflake,
	Waves,
	Wind,
	Zap,
} from "lucide-react";
import { getBreathingPatternById } from "@/api/breathing.api";
import { SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const DIFF_COLORS = {
	beginner: "var(--color-success)",
	intermediate: "var(--color-warning)",
	advanced: "var(--color-danger)",
};

const ENERGY_ICONS = {
	calming: Waves,
	energizing: Zap,
	balancing: Scale,
	cooling: Snowflake,
	heating: Flame,
};

function RatioBox({ label, value, color }) {
	return (
		<div className="flex flex-col items-center gap-1">
			<div
				className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2"
				style={{
					backgroundColor: `${color}18`,
					borderColor: color,
					color,
					fontFamily: '"Fredoka", sans-serif',
				}}
			>
				{value}
			</div>
			<span
				className="text-[10px] font-semibold uppercase tracking-wider"
				style={{ color: "var(--color-text-muted)" }}
			>
				{label}
			</span>
		</div>
	);
}

export default function BreathingDetail() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [pattern, setPattern] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getBreathingPatternById(id)
			.then((r) => setPattern(r.data?.data || r.data))
			.catch(() => setPattern(null))
			.finally(() => setLoading(false));
	}, [id]);

	if (loading) {
		return (
			<div className="px-4 pt-4 flex flex-col gap-4">
				<div
					className="h-48 rounded-3xl animate-pulse"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				/>
				<SkeletonCard />
				<SkeletonCard />
			</div>
		);
	}

	if (!pattern) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<Frown
					size={52}
					className="mb-3"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<p
					className="text-lg font-bold"
					style={{
						color: "var(--color-text-primary)",
						fontFamily: '"Fredoka", sans-serif',
					}}
				>
					{t("breathing_detail.not_found")}
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-sm font-semibold"
					style={{ color: "var(--color-primary)" }}
				>
					← {t("breathing_detail.back")}
				</button>
			</div>
		);
	}

	const ratio = pattern.patternRatio ?? {};
	const diffColor = DIFF_COLORS[pattern.difficulty] ?? "var(--color-primary)";
	const EnergyIcon = ENERGY_ICONS[pattern.energyEffect] ?? Wind;
	const benefits = pattern.benefits ?? [];
	const instructions = pattern.instructions ?? [];
	const ratioStr = pattern.patternRatio
		? `${ratio.inhale ?? 1}:${ratio.hold ?? 0}:${ratio.exhale ?? 1}:${ratio.holdAfterExhale ?? 0}`
		: null;

	return (
		<div className="flex flex-col pb-10">
			{/* Hero banner */}
			<div
				className="relative px-4 pt-12 pb-8 flex flex-col items-center gap-3"
				style={{
					background: `linear-gradient(135deg, ${diffColor}22, ${diffColor}08)`,
				}}
			>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{
						backgroundColor: "var(--color-surface-card)",
						color: "var(--color-text-primary)",
					}}
				>
					<ChevronLeft size={20} />
				</button>

				<div
					className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border-4 shadow-lg"
					style={{
						backgroundColor: "var(--color-surface-card)",
						borderColor: diffColor,
					}}
				>
					<EnergyIcon
						size={48}
						strokeWidth={2.2}
						style={{ color: diffColor }}
					/>
				</div>

				<div className="text-center">
					<h1
						className="text-2xl font-bold"
						style={{
							color: "var(--color-text-primary)",
							fontFamily: '"Fredoka", sans-serif',
						}}
					>
						{pattern.romanizationName}
					</h1>
					{pattern.iastName && (
						<p
							className="text-sm italic"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{pattern.iastName}
						</p>
					)}
					{pattern.sanskritName && (
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{pattern.sanskritName}
						</p>
					)}
				</div>

				<div className="flex gap-2 flex-wrap justify-center">
					<span
						className="px-3 py-1 rounded-full text-xs font-bold text-white"
						style={{ backgroundColor: diffColor }}
					>
						{pattern.difficulty}
					</span>
					{pattern.energyEffect && (
						<span
							className="px-3 py-1 rounded-full text-xs font-semibold border"
							style={{
								borderColor: "var(--color-border)",
								color: "var(--color-text-secondary)",
							}}
						>
							<span className="inline-flex items-center gap-1">
								<EnergyIcon size={13} />
								{pattern.energyEffect}
							</span>
						</span>
					)}
				</div>
			</div>

			<div className="px-4 pt-5 flex flex-col gap-5">
				{/* Description */}
				{pattern.description && (
					<p
						className="text-sm leading-relaxed"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{pattern.description}
					</p>
				)}

				{/* Ratio visual */}
				{ratioStr && (
					<div
						className="rounded-3xl p-5"
						style={{ backgroundColor: "var(--color-surface-card)" }}
					>
						<p
							className="text-xs font-bold uppercase tracking-widest mb-4"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("pranayama.inhale")} · {t("pranayama.hold")} ·{" "}
							{t("pranayama.exhale")} · {t("pranayama.hold")}
						</p>
						<div className="flex justify-around">
							<RatioBox
								label={t("pranayama.inhale")}
								value={ratio.inhale ?? 1}
								color="var(--color-primary)"
							/>
							<RatioBox
								label={t("pranayama.hold")}
								value={ratio.hold ?? 0}
								color="var(--color-secondary)"
							/>
							<RatioBox
								label={t("pranayama.exhale")}
								value={ratio.exhale ?? 1}
								color="var(--color-accent)"
							/>
							<RatioBox
								label={t("pranayama.hold")}
								value={ratio.holdAfterExhale ?? 0}
								color="var(--color-info)"
							/>
						</div>
						<p
							className="text-center mt-4 text-lg font-bold"
							style={{
								color: "var(--color-text-primary)",
								fontFamily: '"Fredoka", sans-serif',
							}}
						>
							{ratioStr}
						</p>
					</div>
				)}

				{/* Benefits */}
				{benefits.length > 0 && (
					<div
						className="rounded-2xl p-4"
						style={{ backgroundColor: "var(--color-surface-card)" }}
					>
						<h3
							className="font-bold mb-3"
							style={{
								color: "var(--color-text-primary)",
								fontFamily: '"Fredoka", sans-serif',
							}}
						>
							{t("breathing_detail.benefits")}
						</h3>
						<ul className="flex flex-col gap-2">
							{benefits.map((b) => (
								<li
									key={b}
									className="flex items-start gap-2 text-sm"
									style={{ color: "var(--color-text-secondary)" }}
								>
									<span style={{ color: "var(--color-primary)" }}>✓</span>
									{b}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Step-by-step instructions */}
				{instructions.length > 0 && (
					<div>
						<h3
							className="font-bold mb-3"
							style={{
								color: "var(--color-text-primary)",
								fontFamily: '"Fredoka", sans-serif',
							}}
						>
							{t("breathing_detail.instructions")}
						</h3>
						<ol className="flex flex-col gap-3">
							{instructions.map((step, i) => (
								<li
									key={`step-${String(step).slice(0, 40)}-${String(step).length}`}
									className="flex items-start gap-3"
								>
									<span
										className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
										style={{ backgroundColor: "var(--color-primary)" }}
									>
										{i + 1}
									</span>
									<p
										className="text-sm leading-relaxed flex-1"
										style={{ color: "var(--color-text-secondary)" }}
									>
										{step}
									</p>
								</li>
							))}
						</ol>
					</div>
				)}
			</div>
		</div>
	);
}

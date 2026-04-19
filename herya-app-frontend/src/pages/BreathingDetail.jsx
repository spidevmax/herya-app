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
import { DIFF_COLORS as SHARED_DIFF_COLORS, colorMix, translateWithFallback, localized, localizedArray } from "@/utils/libraryHelpers";

const DIFF_COLORS = SHARED_DIFF_COLORS;

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
				className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2 font-display"
				style={{
					backgroundColor: colorMix(color, 9),
					borderColor: color,
					color,
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
	const { t, lang } = useLanguage();
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
			<main className="px-4 pt-4 flex flex-col gap-4" aria-busy="true" aria-live="polite">
				<div
					aria-hidden="true"
					className="h-48 rounded-3xl animate-pulse"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				/>
				<SkeletonCard />
				<SkeletonCard />
			</main>
		);
	}

	if (!pattern) {
		return (
			<main className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<Frown
					size={52}
					aria-hidden="true"
					className="mb-3"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<p className="text-lg font-bold font-display text-[var(--color-text-primary)]">
					{t("breathing_detail.not_found")}
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-sm font-semibold"
					style={{ color: "var(--color-primary)" }}
				>
					<span aria-hidden="true">← </span>{t("breathing_detail.back")}
				</button>
			</main>
		);
	}

	const ratio = pattern.patternRatio ?? {};
	const diffColor = DIFF_COLORS[pattern.difficulty] ?? "var(--color-primary)";
	const EnergyIcon = ENERGY_ICONS[pattern.energyEffect] ?? Wind;
	const benefits = localizedArray(pattern, "benefits", lang).length > 0 ? localizedArray(pattern, "benefits", lang) : (pattern.benefits ?? []);
	const contraindications = localizedArray(pattern, "contraindications", lang).length > 0 ? localizedArray(pattern, "contraindications", lang) : (pattern.contraindications ?? []);
	const instructions = pattern.instructions ?? [];
	const ratioStr = pattern.patternRatio
		? `${ratio.inhale ?? 1}:${ratio.hold ?? 0}:${ratio.exhale ?? 1}:${ratio.holdAfterExhale ?? 0}`
		: null;

	return (
		<main className="flex flex-col pb-10">
			{/* Hero banner */}
			<header
				className="relative px-4 pt-12 pb-8 flex flex-col items-center gap-3"
				style={{
					background: `linear-gradient(135deg, ${colorMix(diffColor, 13)}, ${colorMix(diffColor, 3)})`,
				}}
			>
				<button
					type="button"
					onClick={() => navigate(-1)}
					aria-label={t("breathing_detail.back")}
					className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{
						backgroundColor: "var(--color-surface-card)",
						color: "var(--color-text-primary)",
					}}
				>
					<ChevronLeft size={20} aria-hidden="true" />
				</button>

				<div
					aria-hidden="true"
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
					<h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
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

				<ul className="flex gap-2 flex-wrap justify-center list-none m-0 p-0">
					<li>
						<span
							className="px-3 py-1 rounded-full text-xs font-bold text-white"
							style={{ backgroundColor: diffColor }}
						>
							{translateWithFallback(t, `library.${pattern.difficulty}`, pattern.difficulty)}
						</span>
					</li>
					{pattern.energyEffect && (
						<li>
							<span
								className="px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1"
								style={{
									borderColor: "var(--color-border)",
									color: "var(--color-text-secondary)",
								}}
							>
								<EnergyIcon size={13} aria-hidden="true" />
								{translateWithFallback(t, `library.effects.${pattern.energyEffect}`, pattern.energyEffect)}
							</span>
						</li>
					)}
				</ul>
			</header>

			<div className="px-4 pt-5 flex flex-col gap-5">
				{/* Description */}
				{(localized(pattern, "description", lang) || pattern.description) && (
					<p
						className="text-sm leading-relaxed"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{localized(pattern, "description", lang)}
					</p>
				)}

				{/* Ratio visual */}
				{ratioStr && (
					<section
						aria-labelledby="breathing-ratio-heading"
						className="rounded-3xl p-5"
						style={{ backgroundColor: "var(--color-surface-card)" }}
					>
						<h2
							id="breathing-ratio-heading"
							className="text-xs font-bold uppercase tracking-widest mb-4"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("pranayama.inhale")} · {t("pranayama.hold")} ·{" "}
							{t("pranayama.exhale")} · {t("pranayama.hold")}
						</h2>
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
						<p className="text-center mt-4 text-lg font-bold font-display text-[var(--color-text-primary)]">
							{ratioStr}
						</p>
					</section>
				)}

				{/* Benefits */}
				{benefits.length > 0 && (
					<section
						aria-labelledby="breathing-benefits-heading"
						className="rounded-2xl p-4"
						style={{ backgroundColor: "var(--color-surface-card)" }}
					>
						<h2 id="breathing-benefits-heading" className="font-display font-bold mb-3 text-[var(--color-text-primary)]">
							{t("breathing_detail.benefits")}
						</h2>
						<ul className="flex flex-col gap-2 list-none m-0 p-0">
							{benefits.map((b) => (
								<li
									key={b}
									className="flex items-start gap-2 text-sm"
									style={{ color: "var(--color-text-secondary)" }}
								>
									<span aria-hidden="true" style={{ color: "var(--color-primary)" }}>✓</span>
									{b}
								</li>
							))}
						</ul>
					</section>
				)}

				{/* Contraindications */}
				{contraindications.length > 0 && (
					<section
						aria-labelledby="breathing-contraindications-heading"
						className="rounded-2xl p-4"
						style={{
							backgroundColor: "color-mix(in srgb, var(--color-warning) 6%, var(--color-surface-card))",
							border: "1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)",
						}}
					>
						<h2
							id="breathing-contraindications-heading"
							className="font-display font-bold mb-3"
							style={{ color: "var(--color-warning-text, var(--color-text-primary))" }}
						>
							{t("breathing_detail.contraindications")}
						</h2>
						<ul className="flex flex-col gap-2 list-none m-0 p-0">
							{contraindications.map((c) => (
								<li
									key={c}
									className="flex items-start gap-2 text-sm"
									style={{ color: "var(--color-text-secondary)" }}
								>
									<span aria-hidden="true" style={{ color: "var(--color-warning)" }}>⚠</span>
									{c}
								</li>
							))}
						</ul>
					</section>
				)}

				{/* Step-by-step instructions */}
				{instructions.length > 0 && (
					<section aria-labelledby="breathing-instructions-heading">
						<h2 id="breathing-instructions-heading" className="font-display font-bold mb-3 text-[var(--color-text-primary)]">
							{t("breathing_detail.instructions")}
						</h2>
						<ol className="flex flex-col gap-3 list-none m-0 p-0">
							{instructions.map((step, i) => (
								<li
									key={`step-${String(step).slice(0, 40)}-${String(step).length}`}
									className="flex items-start gap-3"
								>
									<span
										aria-hidden="true"
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
					</section>
				)}
			</div>
		</main>
	);
}

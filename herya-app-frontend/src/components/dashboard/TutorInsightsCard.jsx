import {
	ChevronDown,
	ChevronUp,
	Minus,
	ShieldCheck,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const LOW_DATA_THRESHOLD = 4;

const getTrendTone = (value) => {
	if (value >= 70) return "var(--ink)";
	if (value >= 40) return "var(--surya)";
	return "var(--alert)";
};

const getDeltaTone = (value) => {
	if (value > 0) return "var(--ink)";
	if (value < 0) return "var(--alert)";
	return "var(--ink-soft)";
};

const RECOMMENDATION_BG = {
	success: "var(--paper)",
	warning: "var(--paper)",
	info: "var(--paper)",
};

const RECOMMENDATION_COLOR = {
	success: "var(--ink)",
	warning: "var(--surya)",
	info: "var(--ink-soft)",
};

const CONFIDENCE_COLOR = {
	high: "var(--ink)",
	medium: "var(--surya)",
	low: "var(--ink-soft)",
};

const formatPercent = (value = 0) => `${Math.max(0, value)}%`;
const formatDelta = (value = 0) => {
	if (value > 0) return `+${value}`;
	if (value < 0) return `${value}`;
	return "0";
};

const TrendIcon = ({ value, size = 12 }) => {
	if (value > 0) return <TrendingUp size={size} aria-hidden="true" />;
	if (value < 0) return <TrendingDown size={size} aria-hidden="true" />;
	return <Minus size={size} aria-hidden="true" />;
};

const TutorStat = ({ label, value }) => (
	<div
		className="ink-block m-0 p-3"
		style={{
			backgroundColor: "var(--paper)",
			border: "var(--ink-width) solid var(--ink)",
		}}
	>
		<dt
			className="text-[11px] font-bold mb-1"
			style={{ color: "var(--ink-soft)" }}
		>
			{label}
		</dt>
		<dd className="text-lg font-bold m-0" style={{ color: "var(--ink)" }}>
			{value}
		</dd>
	</div>
);

const DeltaRow = ({ value, label, invert = false }) => {
	const tone = getDeltaTone(invert ? -value : value);
	return (
		<li
			className="flex items-center gap-1.5 text-xs m-0"
			style={{ color: tone }}
		>
			<TrendIcon value={invert ? -value : value} />
			<span>
				{label}: <strong>{formatDelta(value)}</strong>
			</span>
		</li>
	);
};

const TutorInsightsCard = ({ tutorInsights }) => {
	const { t } = useLanguage();
	const data = tutorInsights || {};
	const sessionCount = data.sessionCount || 0;
	const hasData = sessionCount > 0;
	const isLowData = sessionCount < LOW_DATA_THRESHOLD;
	const [showDetails, setShowDetails] = useState(false);

	if (!hasData) {
		return (
			<section
				aria-labelledby="tutor-insights-title"
				className="ink-block p-4"
				style={{
					backgroundColor: "var(--paper-raised)",
					border: "var(--ink-width) solid var(--ink)",
				}}
			>
				<header className="flex items-center gap-2 mb-2">
					<span
						aria-hidden="true"
						className="w-8 h-8 rounded-xl flex items-center justify-center"
						style={{ backgroundColor: "var(--paper)" }}
					>
						<ShieldCheck size={16} style={{ color: "var(--chandra)" }} />
					</span>
					<h2
						id="tutor-insights-title"
						className="text-[11px] font-bold"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</h2>
				</header>
				<p className="text-sm" style={{ color: "var(--ink-soft)" }}>
					{t("dashboard.tutor_insights_empty")}
				</p>
			</section>
		);
	}

	const anchorUseRate = Math.max(0, data.anchorUseRate || 0);
	const signalImprovementRate = Math.max(0, data.signalImprovementRate || 0);
	const weeklyTrend = data.weeklyTrend || {};
	const currentWeek = weeklyTrend.currentWeek || {};
	const previousWeek = weeklyTrend.previousWeek || {};
	const delta = weeklyTrend.delta || {};
	const recommendation = data.recommendation || {
		key: "collect_more_data",
		severity: "info",
		preset: "tutor",
		confidence: "low",
	};
	const recommendationConfidence = ["high", "medium", "low"].includes(
		recommendation.confidence,
	)
		? recommendation.confidence
		: "medium";
	const recommendationOutcome = data.recommendationOutcome || {
		appliedCount: 0,
		withSignalOutcome: 0,
		improvedCount: 0,
		improvedRate: 0,
		byPreset: { adult: 0, tutor: 0 },
	};

	const confidenceColor = CONFIDENCE_COLOR[recommendationConfidence];

	return (
		<section
			aria-labelledby="tutor-insights-title"
			className="ink-block flex flex-col gap-4 p-4"
			style={{
				backgroundColor: "var(--paper-raised)",
				border: "var(--ink-width) solid var(--ink)",
			}}
		>
			{/* ── Header ────────────────────────────────────────────────────── */}
			<header className="flex items-start justify-between gap-3">
				<div>
					<p
						className="text-[11px] font-bold"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</p>
					<h2
						id="tutor-insights-title"
						className="font-display text-base font-bold"
						style={{ color: "var(--ink)" }}
					>
						{t("dashboard.tutor_insights_subtitle")}
					</h2>
				</div>
				<span
					aria-hidden="true"
					className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
					style={{
						backgroundColor:
							"color-mix(in srgb, var(--chandra) 14%, transparent)",
					}}
				>
					<ShieldCheck size={18} style={{ color: "var(--chandra)" }} />
				</span>
			</header>

			{/* ── Resumen ────────────────────────────────────────────────────── */}
			<section
				aria-labelledby="tutor-summary-heading"
				className="flex flex-col gap-2"
			>
				<h3
					id="tutor-summary-heading"
					className="text-[11px] font-bold"
					style={{ color: "var(--ink-soft)" }}
				>
					{t("dashboard.tutor_insights_summary_title")}
				</h3>
				<dl className="grid grid-cols-2 gap-2 m-0">
					<TutorStat
						label={t("dashboard.tutor_insights_sessions")}
						value={sessionCount}
					/>
					<TutorStat
						label={t("dashboard.tutor_insights_signal_improved")}
						value={formatPercent(signalImprovementRate)}
					/>
					{!isLowData && (
						<>
							<TutorStat
								label={t("dashboard.tutor_insights_pauses")}
								value={data.totalSafePauses || 0}
							/>
							<TutorStat
								label={t("dashboard.tutor_insights_anchor_use")}
								value={formatPercent(anchorUseRate)}
							/>
						</>
					)}
				</dl>

				<div className="flex items-center justify-between text-xs">
					<span style={{ color: "var(--ink-soft)" }}>
						{t("dashboard.tutor_insights_signal_samples", {
							n: data.signalTransitionsCount || 0,
						})}
					</span>
					<span
						className="inline-flex items-center gap-1 font-semibold"
						style={{ color: getTrendTone(signalImprovementRate) }}
					>
						<TrendIcon
							value={
								signalImprovementRate > 50
									? 1
									: signalImprovementRate < 40
										? -1
										: 0
							}
						/>
						{t("dashboard.tutor_insights_trend", {
							n: formatPercent(signalImprovementRate),
						})}
					</span>
				</div>
			</section>

			{/* ── Tendencia semanal ─────────────────────────────────────────── */}
			{showDetails && !isLowData && (
				<section
					aria-labelledby="tutor-weekly-heading"
					className="ink-block p-3"
					style={{
						backgroundColor: "var(--paper)",
						border: "var(--ink-width) solid var(--ink)",
					}}
				>
					<h3
						id="tutor-weekly-heading"
						className="text-[11px] font-bold mb-2"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.tutor_insights_weekly_title")}
					</h3>
					<div className="grid grid-cols-2 gap-2 text-xs mb-2">
						<p className="m-0" style={{ color: "var(--ink-soft)" }}>
							{t("dashboard.tutor_insights_weekly_current", {
								n: currentWeek.sessionCount || 0,
							})}
						</p>
						<p className="m-0" style={{ color: "var(--ink-soft)" }}>
							{t("dashboard.tutor_insights_weekly_previous", {
								n: previousWeek.sessionCount || 0,
							})}
						</p>
					</div>
					<ul className="flex flex-col gap-1 list-none m-0 p-0">
						<DeltaRow
							value={delta.signalImprovementRate || 0}
							label={t("dashboard.tutor_insights_weekly_delta_signal_label")}
						/>
						<DeltaRow
							value={delta.anchorUseRate || 0}
							label={t("dashboard.tutor_insights_weekly_delta_anchor_label")}
						/>
						<DeltaRow
							value={delta.totalSafePauses || 0}
							label={t("dashboard.tutor_insights_weekly_delta_pauses_label")}
							invert
						/>
					</ul>
				</section>
			)}

			{/* ── Recomendación ─────────────────────────────────────────────── */}
			<section
				aria-labelledby="tutor-reco-heading"
				className="ink-block flex flex-col gap-2 p-3"
				style={{
					backgroundColor:
						RECOMMENDATION_BG[recommendation.severity] ||
						RECOMMENDATION_BG.info,
					border: "var(--ink-width) solid var(--ink)",
				}}
			>
				<div className="flex items-start justify-between gap-2">
					<h3
						id="tutor-reco-heading"
						className="text-[11px] font-bold"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.tutor_insights_reco_title")}
					</h3>
					<span
						className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
						style={{
							color: "var(--ink)",
							border: `var(--ink-width) solid ${confidenceColor}`,
						}}
					>
						{t(
							`dashboard.tutor_insights_confidence_${recommendationConfidence}`,
						)}
					</span>
				</div>
				<p
					className="text-sm font-semibold m-0"
					style={{
						color:
							RECOMMENDATION_COLOR[recommendation.severity] ||
							RECOMMENDATION_COLOR.info,
					}}
				>
					{t(`dashboard.tutor_insights_reco_${recommendation.key}`)}
				</p>
			</section>

			{/* ── Outcome ──────────────────────────────────────────────────── */}
			{showDetails && !isLowData && (
				<section
					aria-labelledby="tutor-outcome-heading"
					className="ink-block p-3"
					style={{
						backgroundColor: "var(--paper)",
						border: "var(--ink-width) solid var(--ink)",
					}}
				>
					<h3
						id="tutor-outcome-heading"
						className="text-[11px] font-bold mb-1"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.tutor_insights_outcome_title")}
					</h3>
					{recommendationOutcome.appliedCount > 0 ? (
						<div className="flex flex-col gap-1">
							<p className="text-xs m-0" style={{ color: "var(--ink-soft)" }}>
								{t("dashboard.tutor_insights_outcome_improved", {
									n: recommendationOutcome.improvedRate || 0,
								})}
							</p>
							<p className="text-xs m-0" style={{ color: "var(--ink-soft)" }}>
								{t("dashboard.tutor_insights_outcome_applied", {
									n: recommendationOutcome.appliedCount || 0,
								})}
								{" · "}
								{t("dashboard.tutor_insights_outcome_sample", {
									n: recommendationOutcome.withSignalOutcome || 0,
								})}
							</p>
							<p className="text-xs m-0" style={{ color: "var(--ink-soft)" }}>
								{t("dashboard.tutor_insights_outcome_by_preset", {
									tutor: recommendationOutcome.byPreset?.tutor || 0,
									adult: recommendationOutcome.byPreset?.adult || 0,
								})}
							</p>
						</div>
					) : (
						<p className="text-xs m-0" style={{ color: "var(--ink-soft)" }}>
							{t("dashboard.tutor_insights_outcome_empty")}
						</p>
					)}
				</section>
			)}

			{/* ── Toggle de detalles ───────────────────────────────────────── */}
			{!isLowData && (
				<button
					type="button"
					onClick={() => setShowDetails((v) => !v)}
					aria-expanded={showDetails}
					className="self-start inline-flex items-center gap-1 text-xs font-semibold cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chandra)]"
					style={{ color: "var(--ink-soft)" }}
				>
					{showDetails
						? t("dashboard.tutor_insights_hide_details")
						: t("dashboard.tutor_insights_show_details")}
					{showDetails ? (
						<ChevronUp size={14} aria-hidden="true" />
					) : (
						<ChevronDown size={14} aria-hidden="true" />
					)}
				</button>
			)}
		</section>
	);
};

export default TutorInsightsCard;

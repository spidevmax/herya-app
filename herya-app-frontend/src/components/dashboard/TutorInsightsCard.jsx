import { ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const getTrendTone = (value) => {
	if (value >= 70) return "var(--color-success)";
	if (value >= 40) return "var(--color-warning)";
	return "var(--color-danger)";
};

const getDeltaTone = (value) => {
	if (value > 0) return "var(--color-success)";
	if (value < 0) return "var(--color-danger)";
	return "var(--color-text-muted)";
};

const RECOMMENDATION_BG = {
	success: "var(--color-success-bg)",
	warning: "var(--color-warning-bg)",
	info: "var(--color-surface)",
};

const RECOMMENDATION_COLOR = {
	success: "var(--color-success)",
	warning: "var(--color-warning)",
	info: "var(--color-text-secondary)",
};

const CONFIDENCE_COLOR = {
	high: "var(--color-success)",
	medium: "var(--color-warning)",
	low: "var(--color-text-muted)",
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
		className="rounded-2xl p-3 m-0"
		style={{
			backgroundColor: "var(--color-surface)",
			border: "1px solid var(--color-border-soft)",
		}}
	>
		<dt
			className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
			style={{ color: "var(--color-text-muted)" }}
		>
			{label}
		</dt>
		<dd
			className="text-lg font-bold m-0"
			style={{ color: "var(--color-text-primary)" }}
		>
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

export default function TutorInsightsCard({ tutorInsights }) {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const data = tutorInsights || {};
	const hasData = (data.sessionCount || 0) > 0;

	if (!hasData) {
		return (
			<section
				aria-labelledby="tutor-insights-title"
				className="rounded-3xl p-4 shadow-[var(--shadow-card)]"
				style={{
					backgroundColor: "var(--color-surface-card)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<header className="flex items-center gap-2 mb-2">
					<span
						aria-hidden="true"
						className="w-8 h-8 rounded-xl flex items-center justify-center"
						style={{ backgroundColor: "var(--color-surface)" }}
					>
						<ShieldCheck size={16} style={{ color: "var(--color-info)" }} />
					</span>
					<h2
						id="tutor-insights-title"
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</h2>
				</header>
				<p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
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
	const recommendationPreset =
		recommendation.preset === "adult" ? "adult" : "tutor";
	const recommendationConfidence = ["high", "medium", "low"].includes(
		recommendation.confidence,
	)
		? recommendation.confidence
		: "medium";
	const recommendationActionLabel =
		recommendationPreset === "adult"
			? "dashboard.tutor_insights_reco_apply_adult"
			: "dashboard.tutor_insights_reco_apply_tutor";
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
			className="rounded-3xl p-4 shadow-[var(--shadow-card)] flex flex-col gap-4"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			{/* ── Header ────────────────────────────────────────────────────── */}
			<header className="flex items-start justify-between gap-3">
				<div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</p>
					<h2
						id="tutor-insights-title"
						className="font-display text-base font-bold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("dashboard.tutor_insights_subtitle")}
					</h2>
				</div>
				<span
					aria-hidden="true"
					className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
					style={{
						backgroundColor: "color-mix(in srgb, var(--color-info) 14%, transparent)",
					}}
				>
					<ShieldCheck size={18} style={{ color: "var(--color-info)" }} />
				</span>
			</header>

			{/* ── Resumen ────────────────────────────────────────────────────── */}
			<section aria-labelledby="tutor-summary-heading" className="flex flex-col gap-2">
				<h3
					id="tutor-summary-heading"
					className="text-[10px] font-bold uppercase tracking-[0.1em]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_summary_title", "Summary")}
				</h3>
				<dl className="grid grid-cols-2 gap-2 m-0">
					<TutorStat
						label={t("dashboard.tutor_insights_sessions")}
						value={data.sessionCount || 0}
					/>
					<TutorStat
						label={t("dashboard.tutor_insights_pauses")}
						value={data.totalSafePauses || 0}
					/>
					<TutorStat
						label={t("dashboard.tutor_insights_anchor_use")}
						value={formatPercent(anchorUseRate)}
					/>
					<TutorStat
						label={t("dashboard.tutor_insights_signal_improved")}
						value={formatPercent(signalImprovementRate)}
					/>
				</dl>

				<div className="flex items-center justify-between text-xs">
					<span style={{ color: "var(--color-text-secondary)" }}>
						{t("dashboard.tutor_insights_signal_samples", {
							n: data.signalTransitionsCount || 0,
						})}
					</span>
					<span
						className="inline-flex items-center gap-1 font-semibold"
						style={{ color: getTrendTone(signalImprovementRate) }}
					>
						<TrendIcon value={signalImprovementRate > 50 ? 1 : signalImprovementRate < 40 ? -1 : 0} />
						{t("dashboard.tutor_insights_trend", {
							n: formatPercent(signalImprovementRate),
						})}
					</span>
				</div>
			</section>

			{/* ── Tendencia semanal ─────────────────────────────────────────── */}
			<section
				aria-labelledby="tutor-weekly-heading"
				className="rounded-2xl p-3"
				style={{
					backgroundColor: "var(--color-surface)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<h3
					id="tutor-weekly-heading"
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_weekly_title")}
				</h3>
				<div className="grid grid-cols-2 gap-2 text-xs mb-2">
					<p className="m-0" style={{ color: "var(--color-text-secondary)" }}>
						{t("dashboard.tutor_insights_weekly_current", {
							n: currentWeek.sessionCount || 0,
						})}
					</p>
					<p className="m-0" style={{ color: "var(--color-text-secondary)" }}>
						{t("dashboard.tutor_insights_weekly_previous", {
							n: previousWeek.sessionCount || 0,
						})}
					</p>
				</div>
				<ul className="flex flex-col gap-1 list-none m-0 p-0">
					<DeltaRow
						value={delta.signalImprovementRate || 0}
						label={t("dashboard.tutor_insights_weekly_delta_signal_label", "Signal")}
					/>
					<DeltaRow
						value={delta.anchorUseRate || 0}
						label={t("dashboard.tutor_insights_weekly_delta_anchor_label", "Anchor use")}
					/>
					<DeltaRow
						value={delta.totalSafePauses || 0}
						label={t("dashboard.tutor_insights_weekly_delta_pauses_label", "Safe pauses")}
						invert
					/>
				</ul>
			</section>

			{/* ── Recomendación ─────────────────────────────────────────────── */}
			<section
				aria-labelledby="tutor-reco-heading"
				className="rounded-2xl p-3 flex flex-col gap-2"
				style={{
					backgroundColor:
						RECOMMENDATION_BG[recommendation.severity] ||
						RECOMMENDATION_BG.info,
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<div className="flex items-start justify-between gap-2">
					<h3
						id="tutor-reco-heading"
						className="text-[10px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.tutor_insights_reco_title")}
					</h3>
					<span
						className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full shrink-0"
						style={{
							backgroundColor: `color-mix(in srgb, ${confidenceColor} 14%, transparent)`,
							color: confidenceColor,
							border: `1px solid color-mix(in srgb, ${confidenceColor} 28%, transparent)`,
						}}
					>
						{t(`dashboard.tutor_insights_confidence_${recommendationConfidence}`)}
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
				<button
					type="button"
					onClick={() =>
						navigate("/start-practice", {
							state: {
								suggestedPreset: recommendationPreset,
								suggestedRecommendation: {
									key: recommendation.key,
									preset: recommendationPreset,
									confidence: recommendationConfidence,
								},
								fromDashboardTutorInsights: true,
							},
						})
					}
					className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
					style={{
						backgroundColor: "var(--color-primary)",
						color: "white",
					}}
				>
					{t(recommendationActionLabel)}
				</button>
			</section>

			{/* ── Outcome ──────────────────────────────────────────────────── */}
			<section
				aria-labelledby="tutor-outcome-heading"
				className="rounded-2xl p-3"
				style={{
					backgroundColor: "var(--color-surface)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<h3
					id="tutor-outcome-heading"
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_outcome_title")}
				</h3>
				{recommendationOutcome.appliedCount > 0 ? (
					<div className="flex flex-col gap-1">
						<p
							className="text-xs m-0"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{t("dashboard.tutor_insights_outcome_improved", {
								n: recommendationOutcome.improvedRate || 0,
							})}
						</p>
						<p className="text-xs m-0" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.tutor_insights_outcome_applied", {
								n: recommendationOutcome.appliedCount || 0,
							})}
							{" · "}
							{t("dashboard.tutor_insights_outcome_sample", {
								n: recommendationOutcome.withSignalOutcome || 0,
							})}
						</p>
						<p className="text-xs m-0" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.tutor_insights_outcome_by_preset", {
								tutor: recommendationOutcome.byPreset?.tutor || 0,
								adult: recommendationOutcome.byPreset?.adult || 0,
							})}
						</p>
					</div>
				) : (
					<p className="text-xs m-0" style={{ color: "var(--color-text-muted)" }}>
						{t("dashboard.tutor_insights_outcome_empty")}
					</p>
				)}
			</section>
		</section>
	);
}

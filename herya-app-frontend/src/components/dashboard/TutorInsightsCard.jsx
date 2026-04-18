import { ShieldCheck } from "lucide-react";
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

const formatPercent = (value = 0) => `${Math.max(0, value)}%`;
const formatDelta = (value = 0) => {
	if (value > 0) return `+${value}`;
	if (value < 0) return `${value}`;
	return "0";
};

const TutorStat = ({ label, value }) => (
	<div
		className="rounded-2xl p-3"
		style={{
			backgroundColor: "var(--color-surface)",
			border: "1px solid var(--color-border-soft)",
		}}
	>
		<p
			className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
			style={{ color: "var(--color-text-muted)" }}
		>
			{label}
		</p>
		<p
			className="text-lg font-bold"
			style={{ color: "var(--color-text-primary)" }}
		>
			{value}
		</p>
	</div>
);

export default function TutorInsightsCard({ tutorInsights }) {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const data = tutorInsights || {};
	const hasData = (data.sessionCount || 0) > 0;

	if (!hasData) {
		return (
			<section
				aria-label={t("dashboard.tutor_insights_title")}
				className="rounded-3xl p-4 shadow-[var(--shadow-card)]"
				style={{
					backgroundColor: "var(--color-surface-card)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<div className="flex items-center gap-2 mb-2">
					<div
						className="w-8 h-8 rounded-xl flex items-center justify-center"
						style={{ backgroundColor: "var(--color-surface)" }}
					>
						<ShieldCheck size={16} style={{ color: "var(--color-info)" }} />
					</div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</p>
				</div>
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
	const recommendationConfidence =
		recommendation.confidence === "high" ||
		recommendation.confidence === "medium" ||
		recommendation.confidence === "low"
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

	return (
		<section
			aria-label={t("dashboard.tutor_insights_title")}
			className="rounded-3xl p-4 shadow-[var(--shadow-card)]"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<header className="flex items-start justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.tutor_insights_title")}
					</p>
					<p
						className="text-sm"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("dashboard.tutor_insights_subtitle")}
					</p>
				</div>
				<div
					className="w-8 h-8 rounded-xl flex items-center justify-center"
					style={{ backgroundColor: "var(--color-surface)" }}
				>
					<ShieldCheck size={16} style={{ color: "var(--color-info)" }} />
				</div>
			</header>

			<div className="grid grid-cols-2 gap-2 mb-3">
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
			</div>

			<div className="flex items-center justify-between text-xs">
				<span style={{ color: "var(--color-text-secondary)" }}>
					{t("dashboard.tutor_insights_signal_samples", {
						n: data.signalTransitionsCount || 0,
					})}
				</span>
				<span
					className="font-semibold"
					style={{ color: getTrendTone(signalImprovementRate) }}
				>
					{t("dashboard.tutor_insights_trend", {
						n: formatPercent(signalImprovementRate),
					})}
				</span>
			</div>

			<div
				className="mt-3 rounded-2xl p-3"
				style={{
					backgroundColor: "var(--color-surface)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-2"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_weekly_title")}
				</p>
				<div className="grid grid-cols-2 gap-2 text-xs mb-2">
					<p style={{ color: "var(--color-text-secondary)" }}>
						{t("dashboard.tutor_insights_weekly_current", {
							n: currentWeek.sessionCount || 0,
						})}
					</p>
					<p style={{ color: "var(--color-text-secondary)" }}>
						{t("dashboard.tutor_insights_weekly_previous", {
							n: previousWeek.sessionCount || 0,
						})}
					</p>
				</div>
				<div className="flex flex-col gap-1 text-xs">
					<p style={{ color: getDeltaTone(delta.signalImprovementRate || 0) }}>
						{t("dashboard.tutor_insights_weekly_delta_signal", {
							n: formatDelta(delta.signalImprovementRate || 0),
						})}
					</p>
					<p style={{ color: getDeltaTone(delta.anchorUseRate || 0) }}>
						{t("dashboard.tutor_insights_weekly_delta_anchor", {
							n: formatDelta(delta.anchorUseRate || 0),
						})}
					</p>
					<p style={{ color: getDeltaTone(-1 * (delta.totalSafePauses || 0)) }}>
						{t("dashboard.tutor_insights_weekly_delta_pauses", {
							n: formatDelta(delta.totalSafePauses || 0),
						})}
					</p>
				</div>
			</div>

			<div
				className="mt-3 rounded-2xl p-3"
				style={{
					backgroundColor:
						RECOMMENDATION_BG[recommendation.severity] ||
						RECOMMENDATION_BG.info,
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_reco_title")}
				</p>
				<p
					className="text-xs font-medium"
					style={{
						color:
							RECOMMENDATION_COLOR[recommendation.severity] ||
							RECOMMENDATION_COLOR.info,
					}}
				>
					{t(`dashboard.tutor_insights_reco_${recommendation.key}`)}
				</p>
				<p
					className="text-[11px] mt-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_reco_confidence", {
						n: t(
							`dashboard.tutor_insights_confidence_${recommendationConfidence}`,
						),
					})}
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
					className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
					style={{
						backgroundColor: "var(--color-primary)",
						color: "white",
					}}
				>
					{t(recommendationActionLabel)}
				</button>
			</div>

			<div
				className="mt-3 rounded-2xl p-3"
				style={{
					backgroundColor: "var(--color-surface)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.tutor_insights_outcome_title")}
				</p>
				{recommendationOutcome.appliedCount > 0 ? (
					<div className="flex flex-col gap-1">
						<p
							className="text-xs"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{t("dashboard.tutor_insights_outcome_improved", {
								n: recommendationOutcome.improvedRate || 0,
							})}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.tutor_insights_outcome_applied", {
								n: recommendationOutcome.appliedCount || 0,
							})}
							{" · "}
							{t("dashboard.tutor_insights_outcome_sample", {
								n: recommendationOutcome.withSignalOutcome || 0,
							})}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.tutor_insights_outcome_by_preset", {
								tutor: recommendationOutcome.byPreset?.tutor || 0,
								adult: recommendationOutcome.byPreset?.adult || 0,
							})}
						</p>
					</div>
				) : (
					<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
						{t("dashboard.tutor_insights_outcome_empty")}
					</p>
				)}
			</div>
		</section>
	);
}

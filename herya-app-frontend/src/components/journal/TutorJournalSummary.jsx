import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { SurfaceCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const SIGNAL_SCORE = {
	red: 0,
	yellow: 1,
	green: 2,
};

const isValidSignal = (value) =>
	value === "green" || value === "yellow" || value === "red";

const formatPercent = (value) => `${Math.round(value)}%`;

export const TutorJournalSummary = ({ entries }) => {
	const { t } = useLanguage();

	const summary = useMemo(() => {
		let latestSignalAfter = null;
		let safePauseCount = 0;
		let anchorAvailableSessions = 0;
		let anchorUsedSessions = 0;
		let transitionCount = 0;
		let improvedTransitions = 0;

		entries.forEach((entry) => {
			const signalAfter = entry?.signalAfter;
			const signalBefore = entry?.session?.checkIn?.signal;
			const tutorSupport = entry?.session?.tutorSupport || {};

			if (!latestSignalAfter && isValidSignal(signalAfter)) {
				latestSignalAfter = signalAfter;
			}

			if (isValidSignal(signalBefore) && isValidSignal(signalAfter)) {
				transitionCount += 1;
				if (SIGNAL_SCORE[signalAfter] > SIGNAL_SCORE[signalBefore]) {
					improvedTransitions += 1;
				}
			}

			safePauseCount += Math.max(0, Number(tutorSupport?.safePauseCount) || 0);

			if (tutorSupport?.anchorAvailable) {
				anchorAvailableSessions += 1;
			}
			if (tutorSupport?.anchorUsed) {
				anchorUsedSessions += 1;
			}
		});

		const improvedRate =
			transitionCount > 0
				? (improvedTransitions / transitionCount) * 100
				: null;
		const anchorUseRate =
			anchorAvailableSessions > 0
				? (anchorUsedSessions / anchorAvailableSessions) * 100
				: null;

		return {
			latestSignalAfter,
			safePauseCount,
			transitionCount,
			improvedRate,
			anchorUseRate,
		};
	}, [entries]);

	const hasTutorData =
		summary.latestSignalAfter ||
		summary.safePauseCount > 0 ||
		summary.transitionCount > 0 ||
		summary.anchorUseRate !== null;

	if (!hasTutorData) return null;

	const latestSignalLabel = summary.latestSignalAfter
		? t(`practice.signal_${summary.latestSignalAfter}`)
		: t("journal.tutor_summary_no_data");

	return (
		<SurfaceCard className="p-4 shadow-none">
			<div className="flex items-center justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("journal.tutor_summary_title")}
					</p>
					<p
						className="text-sm"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("journal.tutor_summary_subtitle")}
					</p>
				</div>
				<div
					className="w-8 h-8 rounded-xl flex items-center justify-center"
					style={{ backgroundColor: "var(--color-surface)" }}
				>
					<ShieldCheck size={16} style={{ color: "var(--color-info)" }} />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 mb-3">
				<div className="rounded-xl p-2.5 bg-[var(--color-surface)]">
					<p
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("journal.tutor_summary_current_signal")}
					</p>
					<p
						className="text-xs font-semibold mt-0.5"
						style={{ color: "var(--color-text-primary)" }}
					>
						{latestSignalLabel}
					</p>
				</div>
				<div className="rounded-xl p-2.5 bg-[var(--color-surface)]">
					<p
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("journal.tutor_summary_safe_pauses")}
					</p>
					<p
						className="text-xs font-semibold mt-0.5"
						style={{ color: "var(--color-text-primary)" }}
					>
						{summary.safePauseCount}
					</p>
				</div>
				<div className="rounded-xl p-2.5 bg-[var(--color-surface)]">
					<p
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("journal.tutor_summary_improved")}
					</p>
					<p
						className="text-xs font-semibold mt-0.5"
						style={{ color: "var(--color-text-primary)" }}
					>
						{summary.improvedRate === null
							? t("journal.tutor_summary_no_data")
							: formatPercent(summary.improvedRate)}
					</p>
				</div>
				<div className="rounded-xl p-2.5 bg-[var(--color-surface)]">
					<p
						className="text-[10px]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("journal.tutor_summary_anchor_usage")}
					</p>
					<p
						className="text-xs font-semibold mt-0.5"
						style={{ color: "var(--color-text-primary)" }}
					>
						{summary.anchorUseRate === null
							? t("journal.tutor_summary_no_data")
							: formatPercent(summary.anchorUseRate)}
					</p>
				</div>
			</div>

			<p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
				{t("journal.tutor_summary_signal_transitions", {
					n: summary.transitionCount,
				})}
			</p>
		</SurfaceCard>
	);
};

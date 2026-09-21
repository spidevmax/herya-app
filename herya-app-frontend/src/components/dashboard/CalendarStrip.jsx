import { Check } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DAY_LABEL_KEYS } from "@/utils/constants";
import "@/styles/identity.css";

const toLocalIsoDate = (date) => {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return localDate.toISOString().slice(0, 10);
};

function getCalendarDays(sessionDates = []) {
	const today = new Date();
	const todayIso = toLocalIsoDate(today);
	const practiced = new Set(sessionDates.map((d) => d.slice(0, 10)));
	return Array.from({ length: 14 }, (_, i) => {
		const d = new Date(today);
		d.setDate(today.getDate() - (13 - i));
		const iso = toLocalIsoDate(d);
		const isToday = iso === todayIso;
		return {
			date: d,
			iso,
			labelKey: DAY_LABEL_KEYS[d.getDay()],
			day: d.getDate(),
			practiced: practiced.has(iso),
			isToday,
		};
	});
}

const SKELETON_DAYS = Array.from({ length: 14 }, (_, i) => `d-${i}`);

const CalendarStrip = ({
	sessionDates = [],
	streak = 0,
	weekSessions = null,
	loading = false,
}) => {
	const { t } = useLanguage();
	const stripRef = useRef(null);
	const days = useMemo(() => getCalendarDays(sessionDates), [sessionDates]);

	useEffect(() => {
		if (loading) return;
		const strip = stripRef.current;
		if (!strip) return;
		strip.scrollLeft = strip.scrollWidth;
	}, [loading]);

	if (loading) {
		return (
			<section
				data-identity="next"
				aria-busy="true"
				aria-label={t("dashboard.practice_label")}
			>
				<div className="flex items-center justify-between mb-3">
					<span className="skeleton h-3 w-28 rounded-lg" aria-hidden="true" />
					<span className="skeleton h-4 w-20 rounded-full" aria-hidden="true" />
				</div>
				<div className="flex gap-2 pb-1" aria-hidden="true">
					{SKELETON_DAYS.map((key) => (
						<div
							key={key}
							className="flex-shrink-0 flex flex-col items-center gap-1 w-10"
						>
							<span className="skeleton h-2.5 w-6 rounded" />
							<span className="skeleton w-9 h-9 rounded-full" />
						</div>
					))}
				</div>
			</section>
		);
	}

	return (
		<section data-identity="next" aria-label={t("dashboard.practice_label")}>
			<header className="flex items-center justify-between mb-3 ">
				<span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
					{t("dashboard.practice_label")}
				</span>
				<div className="flex items-center gap-2">
					{weekSessions !== null && weekSessions > 0 && (
						<span
							className="px-2 py-0.5 text-xs font-bold"
							style={{
								border: "var(--ink-width) solid var(--ink)",
								borderRadius: "var(--radius-block)",
								color: "var(--ink-soft)",
							}}
						>
							{t("dashboard.sessions_this_week", { n: weekSessions })}
						</span>
					)}
					<span className="text-sm font-bold" style={{ color: "var(--ink)" }}>
						{t("dashboard.day_streak", { n: streak })}
					</span>
				</div>
			</header>
			<ol
				ref={stripRef}
				aria-label={t("dashboard.practice_label")}
				className="flex gap-2 overflow-x-auto  pb-1"
			>
				{days.map((d) => (
					<li
						key={d.iso}
						className="flex w-10 flex-shrink-0 flex-col items-center gap-1"
						aria-label={`${t(d.labelKey)} ${d.day}${d.practiced ? ` — ${t("dashboard.practiced")}` : ""}${d.isToday ? ` — ${t("dashboard.today")}` : ""}`}
					>
						<span
							className="text-[10px] font-bold"
							style={{ color: d.isToday ? "var(--ink)" : "var(--ink-soft)" }}
						>
							{t(d.labelKey)}
						</span>
						{/* Today is ink-filled, a practised day is surya, an empty day
						    is just an outline. Three states, no shadows. */}
						<div
							className="flex h-9 w-9 items-center justify-center text-sm font-bold"
							style={{
								background: d.isToday
									? "var(--ink)"
									: d.practiced
										? "var(--surya)"
										: "transparent",
								color: d.isToday ? "var(--paper)" : "var(--on-fill)",
								border: "var(--ink-width) solid var(--ink)",
								borderRadius: "999px",
							}}
						>
							{d.practiced && !d.isToday ? (
								<Check size={16} strokeWidth={3} />
							) : (
								d.day
							)}
						</div>
					</li>
				))}
			</ol>
		</section>
	);
};

export default CalendarStrip;

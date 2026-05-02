import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DAY_LABEL_KEYS } from "@/utils/constants";

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

export default function CalendarStrip({
	sessionDates = [],
	streak = 0,
	weekSessions = null,
	loading = false,
}) {
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
			<section aria-busy="true" aria-label={t("dashboard.practice_label")}>
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
		<section aria-label={t("dashboard.practice_label")}>
			<header className="flex items-center justify-between mb-3 ">
				<span
					className="text-[11px] font-bold uppercase tracking-[0.1em]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.practice_label")}
				</span>
				<div className="flex items-center gap-2">
					{weekSessions !== null && weekSessions > 0 && (
						<span
							className="text-xs font-medium px-2 py-0.5 rounded-full"
							style={{
								backgroundColor: "var(--color-surface)",
								color: "var(--color-text-secondary)",
							}}
						>
							{t("dashboard.sessions_this_week", { n: weekSessions })}
						</span>
					)}
					<span
						className="font-bold text-sm"
						style={{ color: "var(--color-secondary)" }}
					>
						{t("dashboard.day_streak", { n: streak })}
					</span>
				</div>
			</header>
			<ol
				ref={stripRef}
				aria-label={t("dashboard.practice_label")}
				className="flex gap-2 overflow-x-auto  pb-1"
			>
				{days.map((d, i) => (
					<motion.li
						key={d.iso}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.03 }}
						className="flex-shrink-0 flex flex-col items-center gap-1 w-10"
						aria-label={`${t(d.labelKey)} ${d.day}${d.practiced ? ` — ${t("dashboard.practiced")}` : ""}${d.isToday ? ` — ${t("dashboard.today")}` : ""}`}
					>
						<span
							className="text-[10px] font-semibold"
							style={{
								color: d.isToday
									? "var(--color-primary)"
									: "var(--color-text-muted)",
							}}
						>
							{t(d.labelKey)}
						</span>
						<div
							className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
							style={{
								backgroundColor: d.isToday
									? "var(--color-primary)"
									: d.practiced
										? "var(--color-secondary)"
										: "var(--color-surface)",
								color:
									d.isToday || d.practiced
										? "white"
										: "var(--color-text-secondary)",
								boxShadow: d.isToday
									? "0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent), 0 4px 12px color-mix(in srgb, var(--color-primary) 35%, transparent)"
									: "none",
							}}
						>
							{d.practiced && !d.isToday ? (
								<Check size={16} strokeWidth={3} />
							) : (
								d.day
							)}
						</div>
					</motion.li>
				))}
			</ol>
		</section>
	);
}

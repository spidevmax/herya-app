import { motion } from "framer-motion";
import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { DAY_LABELS } from "@/utils/constants";

function getCalendarDays(sessionDates = []) {
	const today = new Date();
	const practiced = new Set(sessionDates.map((d) => d.slice(0, 10)));
	return Array.from({ length: 14 }, (_, i) => {
		const d = new Date(today);
		d.setDate(today.getDate() - (13 - i));
		const iso = d.toISOString().slice(0, 10);
		const isToday = i === 13;
		return {
			date: d,
			iso,
			label: DAY_LABELS[d.getDay()],
			day: d.getDate(),
			practiced: practiced.has(iso),
			isToday,
		};
	});
}

export default function CalendarStrip({
	sessionDates = [],
	streak = 0,
	weekSessions = null,
}) {
	const { t } = useLanguage();
	const days = useMemo(() => getCalendarDays(sessionDates), [sessionDates]);

	return (
		<div>
			<div className="flex items-center justify-between mb-3 px-4 sm:px-6">
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
			</div>
			<div className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-1">
				{days.map((d, i) => (
					<motion.div
						key={d.iso}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.03 }}
						className="flex-shrink-0 flex flex-col items-center gap-1 w-10"
					>
						<span
							className="text-[10px] font-semibold"
							style={{
								color: d.isToday
									? "var(--color-primary)"
									: "var(--color-text-muted)",
							}}
						>
							{d.label}
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
									? "0 4px 12px rgba(78,139,106,0.35)"
									: "none",
							}}
						>
							{d.practiced && !d.isToday ? "✓" : d.day}
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DAY_LABELS } from "../../utils/constants";

function getCalendarDays(sessionDates = []) {
  const today = new Date();
  const practiced = new Set(sessionDates.map((d) => d.slice(0, 10)));
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    const isToday = i === 13;
    return { date: d, iso, label: DAY_LABELS[d.getDay()], day: d.getDate(), practiced: practiced.has(iso), isToday };
  });
}

export default function CalendarStrip({ sessionDates = [], streak = 0 }) {
  const days = useMemo(() => getCalendarDays(sessionDates), [sessionDates]);
  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-4">
        <span className="text-sm font-semibold text-[#6B7280]">Your Practice</span>
        <span className="flex items-center gap-1 text-[#FFB347] font-bold text-sm">🔥 {streak} day streak</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d, i) => (
          <motion.div
            key={d.iso}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex-shrink-0 flex flex-col items-center gap-1 w-10"
          >
            <span className={"text-[10px] font-semibold " + (d.isToday ? "text-[#4A72FF]" : "text-[#9CA3AF]")}>{d.label}</span>
            <div className={"w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all " +
              (d.isToday ? "bg-[#4A72FF] text-white shadow-[0_4px_12px_rgba(74,114,255,0.4)]" :
               d.practiced ? "bg-[#5DB075] text-white" : "bg-[#E8E4DE] text-[#9CA3AF]")}>
              {d.practiced && !d.isToday ? "✓" : d.day}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getRecommendedSequence } from "../api/sequences.api";
import { getSessions, getSessionStats } from "../api/sessions.api";
import HeroCard from "../components/dashboard/HeroCard";
import CalendarStrip from "../components/dashboard/CalendarStrip";
import QuickActions from "../components/dashboard/QuickActions";
import RecentSessionCard from "../components/dashboard/RecentSessionCard";
import { SkeletonCard } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();
  const [recommended, setRecommended] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getRecommendedSequence(), getSessions({ limit: 5 }), getSessionStats()])
      .then(([rec, sess, st]) => {
        if (rec.status === "fulfilled") setRecommended(rec.value.data?.data || rec.value.data);
        if (sess.status === "fulfilled") { const list = sess.value.data?.data || sess.value.data || []; setSessions(Array.isArray(list) ? list : []); }
        if (st.status === "fulfilled") setStats(st.value.data?.data || st.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const sessionDates = sessions.map((s) => (s.date || s.createdAt || "").slice(0, 10));
  const greeting = ["Good morning", "Good afternoon", "Good evening"][[0, 12, 17].findLastIndex((h) => new Date().getHours() >= h)];

  return (
    <div className="flex flex-col gap-6 pt-4 pb-6">
      <div className="flex items-center justify-between px-4">
        <div>
          <p className="text-[#9CA3AF] text-sm">{greeting},</p>
          <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">{user?.name?.split(" ")[0] ?? "Yogi"} 🙏</h1>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-[#6B7280]">
          <Bell size={20} />
        </motion.button>
      </div>

      <CalendarStrip sessionDates={sessionDates} streak={stats?.currentStreak ?? 0} />

      <HeroCard sequence={recommended} loading={loading} />

      <QuickActions />

      {sessions.length > 0 && (
        <div className="px-4 flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold text-[#1A1A2E]">Recent Practice</h2>
          {loading ? Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />) : sessions.map((s, i) => <RecentSessionCard key={s._id} session={s} index={i} />)}
        </div>
      )}
    </div>
  );
}

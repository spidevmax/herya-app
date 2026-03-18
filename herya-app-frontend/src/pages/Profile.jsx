import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, LogOut, Clock, Flame, BookOpen, Award } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserStats } from "../api/users.api";
import { getSessionStats } from "../api/sessions.api";
import { Button } from "../components/ui";

function StatCard({ icon, label, value, color = "#4A72FF" }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ backgroundColor: color + "15" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="font-bold text-xl text-[#1A1A2E]">{value}</p>
      <p className="text-[#9CA3AF] text-xs">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    Promise.allSettled([getSessionStats(), getUserStats()])
      .then(([s, u]) => {
        if (s.status === "fulfilled") setStats(s.value.data?.data || s.value.data);
        if (u.status === "fulfilled") setUserStats(u.value.data?.data || u.value.data);
      });
  }, []);

  const level = user?.level ?? userStats?.level ?? 1;
  const xp = user?.experiencePoints ?? userStats?.experiencePoints ?? 0;
  const xpToNext = level * 100;
  const progress = Math.min((xp % xpToNext) / xpToNext, 1);

  return (
    <div className="flex flex-col gap-6 pt-4 pb-6 px-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Profile</h1>
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[#6B7280]">
          <Edit size={18} />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#4A72FF] to-[#7B9FFF] rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" /> : "🧘"}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{user?.name}</h2>
            <p className="text-white/70 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs font-bold">Level {level}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-white/80 text-xs mb-1.5">
          <span>{xp} XP</span><span>{xpToNext} XP</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: progress * 100 + "%" }} transition={{ duration: 1, delay: 0.3 }} className="h-full bg-white rounded-full" />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Flame size={20} />} label="Day Streak" value={stats?.currentStreak ?? 0} color="#FFB347" />
        <StatCard icon={<Clock size={20} />} label="Total Hours" value={Math.round((stats?.totalDuration ?? 0) / 60)} color="#4A72FF" />
        <StatCard icon={<BookOpen size={20} />} label="Sessions" value={stats?.totalSessions ?? 0} color="#5DB075" />
        <StatCard icon={<Award size={20} />} label="Best Streak" value={stats?.longestStreak ?? 0} color="#9B5DE5" />
      </div>

      <Button variant="outline" onClick={logout} className="text-red-500 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 w-full">
        <LogOut size={16} /> Sign Out
      </Button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { getSessions, getSessionStats } from "@/api/sessions.api";
import { getRecommendedSequence } from "@/api/sequences.api";
import CalendarStrip from "@/components/dashboard/CalendarStrip";
import HeroCard from "@/components/dashboard/HeroCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentSessionCard from "@/components/dashboard/RecentSessionCard";
import { SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function Dashboard() {
	const { user } = useAuth();
	const { t } = useLanguage();
	const [recommended, setRecommended] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.allSettled([
			getRecommendedSequence(),
			getSessions({ limit: 5 }),
			getSessionStats(),
		])
			.then(([rec, sess, st]) => {
				if (rec.status === "fulfilled") {
					// Backend returns { sequence, reason } — extract the sequence object
					const payload = rec.value.data?.data || rec.value.data;
					setRecommended(payload?.sequence ?? payload);
				}
				if (sess.status === "fulfilled") {
					// Backend returns { sessions, pagination }
					const payload = sess.value.data?.data || sess.value.data || {};
					const list = payload.sessions ?? (Array.isArray(payload) ? payload : []);
					setSessions(list);
				}
				if (st.status === "fulfilled")
					setStats(st.value.data?.data || st.value.data);
			})
			.finally(() => setLoading(false));
	}, []);

	const sessionDates = sessions.map((s) =>
		(s.date || s.createdAt || "").slice(0, 10),
	);

	const hour = new Date().getHours();
	const greetingKey =
		hour < 12 ? "dashboard.greeting_morning"
		: hour < 17 ? "dashboard.greeting_afternoon"
		: "dashboard.greeting_evening";

	return (
		<div className="flex flex-col gap-6 pt-4 pb-6">
			<div className="flex items-center justify-between px-4">
				<div>
					<p
						className="text-sm font-medium"
						style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-text-secondary)" }}
					>
						{t(greetingKey)},
					</p>
					<h1
						className="text-2xl font-semibold"
						style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-primary)" }}
					>
						{user?.name?.split(" ")[0] ?? "Yogi"}
					</h1>
				</div>
				<motion.button
					whileTap={{ scale: 0.9 }}
					className="w-11 h-11 rounded-full shadow-sm flex items-center justify-center"
					style={{ backgroundColor: "var(--color-surface-card)", color: "var(--color-secondary)" }}
				>
					<Bell size={20} />
				</motion.button>
			</div>

			<CalendarStrip sessionDates={sessionDates} streak={stats?.currentStreak ?? 0} />

			<HeroCard sequence={recommended} loading={loading} />

			<QuickActions />

			{sessions.length > 0 && (
				<div className="px-4 flex flex-col gap-3">
					<h2
						className="text-lg font-semibold"
						style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-primary)" }}
					>
						{t("dashboard.recent_practice")}
					</h2>
					{loading
						? ["dash-s1", "dash-s2", "dash-s3"].map((k) => <SkeletonCard key={k} />)
						: sessions.map((s, i) => (
								<RecentSessionCard key={s._id} session={s} index={i} />
							))}
				</div>
			)}
		</div>
	);
}

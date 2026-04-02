import { useEffect, useState } from "react";
import { getRecommendedSequence } from "@/api/sequences.api";
import { getSessions, getSessionStats } from "@/api/sessions.api";
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
	const [recommendReason, setRecommendReason] = useState(null);
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
					const payload = rec.value.data?.data || rec.value.data;
					setRecommended(payload?.sequence ?? payload);
					setRecommendReason(payload?.reason ?? null);
				}
				if (sess.status === "fulfilled") {
					const payload = sess.value.data?.data || sess.value.data || {};
					const list =
						payload.sessions ?? (Array.isArray(payload) ? payload : []);
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
	// sessionsPerWeek[3] is the current week (index 0 = oldest of last 4 weeks)
	const weekSessions = stats?.sessionsPerWeek?.[3] ?? null;

	const hour = new Date().getHours();
	const greetingKey =
		hour < 12
			? "dashboard.greeting_morning"
			: hour < 17
				? "dashboard.greeting_afternoon"
				: "dashboard.greeting_evening";

	return (
		<div className="flex flex-col gap-5 pt-4 pb-6 max-w-7xl mx-auto">
			{/* ── Header ────────────────────────────────────────────────────── */}
			<div className="flex items-center justify-between px-4 sm:px-6">
				<div>
					<p
						className="text-sm font-medium"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t(greetingKey)},
					</p>
					<h1
						className="text-2xl font-semibold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-primary)",
						}}
					>
						{user?.name?.split(" ")[0] ?? "Yogi"}
					</h1>
				</div>
			</div>

			{/* ── Responsive grid ───────────────────────────────────────────
			    Mobile (1 col):  Calendar → Hero → QuickActions → Recent
			    Desktop (2 col): left = Hero / Recent · right = Calendar / QuickActions
			    DOM order must match mobile order; lg: explicit placement for desktop.
			────────────────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] lg:gap-x-4 gap-y-5 items-start">
				{/* Calendar — DOM 1 → mobile top · desktop right-top */}
				<div className="lg:col-start-2 lg:row-start-1">
					<CalendarStrip
						sessionDates={sessionDates}
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions}
					/>
				</div>

				{/* Hero — DOM 2 → mobile 2nd · desktop left-top */}
				<div className="lg:col-start-1 lg:row-start-1">
					<HeroCard
						sequence={recommended}
						reason={recommendReason}
						loading={loading}
					/>
				</div>

				{/* QuickActions — DOM 3 → mobile 3rd · desktop right-bottom */}
				<div className="lg:col-start-2 lg:row-start-2">
					<QuickActions user={user} />
				</div>

				{/* Recent Sessions — DOM 4 → mobile 4th · desktop left-bottom */}
				<div className="lg:col-start-1 lg:row-start-2 px-4 sm:px-6 flex flex-col gap-3">
					{loading ? (
						<>
							<div className="h-4 w-36 rounded-lg skeleton" />
							{["s1", "s2", "s3"].map((k) => (
								<SkeletonCard key={k} />
							))}
						</>
					) : sessions.length > 0 ? (
						<>
							<h2
								className="text-[11px] font-bold uppercase tracking-[0.1em]"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("dashboard.recent_practice")}
							</h2>
							{sessions.map((s, i) => (
								<RecentSessionCard key={s._id} session={s} index={i} />
							))}
						</>
					) : (
						<div
							className="rounded-3xl p-6 text-center shadow-[var(--shadow-card)]"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<p
								className="text-sm font-semibold mb-1"
								style={{ color: "var(--color-text-primary)" }}
							>
								{t("dashboard.no_sessions_title")}
							</p>
							<p
								className="text-xs"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("dashboard.no_sessions_hint")}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

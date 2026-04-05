import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRecommendedSequence } from "@/api/sequences.api";
import { getSessions, getSessionStats } from "@/api/sessions.api";
import CalendarStrip from "@/components/dashboard/CalendarStrip";
import HeroCard from "@/components/dashboard/HeroCard";
import PracticeSnapshotCard from "@/components/dashboard/PracticeSnapshotCard";
import SoftReminderCard from "@/components/dashboard/SoftReminderCard";
import RecentSessionCard from "@/components/dashboard/RecentSessionCard";
import TutorInsightsCard from "@/components/dashboard/TutorInsightsCard";
import { SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function Dashboard() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [recommended, setRecommended] = useState(null);
	const [recommendReason, setRecommendReason] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const isTutorUser = user?.role === "tutor";

	const loadDashboard = () => {
		setLoading(true);
		setError(false);
		Promise.allSettled([
			getRecommendedSequence(),
			getSessions({ limit: 5 }),
			getSessionStats(),
		])
			.then(([rec, sess, st]) => {
				const allRejected =
					rec.status === "rejected" &&
					sess.status === "rejected" &&
					st.status === "rejected";
				if (allRejected) {
					setError(true);
					return;
				}
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
	};

	useEffect(() => {
		loadDashboard();
	}, []);

	const completedSessions = sessions.filter((session) => session.completed);
	const pendingSession = sessions.find((session) => !session.completed) || null;
	const totalPracticeMinutes = completedSessions.reduce(
		(sum, session) => sum + (Number(session.duration) || 0),
		0,
	);

	const sessionDates = completedSessions.map((s) =>
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
		<div className="flex flex-col gap-6 pt-4 pb-6 max-w-7xl mx-auto px-4 lg:px-6">
			{/* ── Header ────────────────────────────────────────────────────── */}
			<motion.div
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex items-center justify-between"
			>
				<div>
					<p
						className="text-sm font-medium"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t(greetingKey)},
					</p>
					<h1 className="text-2xl font-semibold text-[var(--color-primary)]">
						{user?.name?.split(" ")[0] ?? "Yogi"}
					</h1>
				</div>
			</motion.div>

			{error && (
				<motion.button
					type="button"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					onClick={loadDashboard}
					className="w-full rounded-2xl p-4 flex items-center gap-3 text-left"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
					}}
				>
					<AlertTriangle size={20} style={{ color: "var(--color-warning)" }} />
					<div>
						<p className="text-sm font-semibold text-[var(--color-text-primary)]">
							{t("dashboard.error_title")}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.error_hint")}
						</p>
					</div>
				</motion.button>
			)}

			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: 0.05 }}
			>
				<SoftReminderCard
					user={user}
					sessions={sessions}
					streak={stats?.currentStreak ?? 0}
				/>
			</motion.div>

			{/* ── Responsive grid ───────────────────────────────────────────
			    Mobile (1 col):  Calendar → Hero → Recent
			    Desktop (2 col): left (55%) = Hero / Recent · right (45%) = Calendar / Snapshot / Tutor
			    DOM order must match mobile order; lg: explicit placement for desktop.
			────────────────────────────────────────────────────────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-[55%_45%] lg:gap-x-5 gap-y-5 items-start">
				{/* Calendar — DOM 1 → mobile top · desktop right-top */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.1 }}
					className="lg:col-start-2 lg:row-start-1"
				>
					<CalendarStrip
						sessionDates={sessionDates}
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions}
					/>
				</motion.div>

				{/* Hero — DOM 2 → mobile 2nd · desktop left-top */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.15 }}
					className="lg:col-start-1 lg:row-start-1"
				>
					<HeroCard
						sequence={recommended}
						reason={recommendReason}
						loading={loading}
					/>
				</motion.div>

				{/* Snapshot — mobile flow after hero · desktop right middle */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.2 }}
					className="lg:col-start-2 lg:row-start-2"
				>
					<PracticeSnapshotCard
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions ?? 0}
						totalPracticeMinutes={totalPracticeMinutes}
						pendingSession={pendingSession}
					/>
				</motion.div>

				{/* Tutor insights — visible only for tutor users */}
				{isTutorUser && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.25 }}
						className="lg:col-start-2 lg:row-start-3"
					>
						<TutorInsightsCard tutorInsights={stats?.tutorInsights} />
					</motion.div>
				)}

				{/* Recent Sessions — DOM 4 → mobile 4th · desktop left-bottom */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.25 }}
					className="lg:col-start-1 lg:row-start-2 flex flex-col gap-3"
				>
					{loading ? (
						<>
							<div className="h-4 w-36 rounded-lg skeleton" />
							{["s1", "s2", "s3"].map((k) => (
								<SkeletonCard key={k} />
							))}
						</>
					) : (
						<>
							{pendingSession && (
								<div
									className="rounded-3xl p-4 shadow-[var(--shadow-card)] flex items-center justify-between gap-3"
									style={{
										backgroundColor: "var(--color-surface-card)",
										border: "1px solid var(--color-border-soft)",
									}}
								>
									<div className="min-w-0">
										<p
											className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1"
											style={{ color: "var(--color-text-muted)" }}
										>
											{t("dashboard.resume_practice")}
										</p>
										<p
											className="text-sm font-semibold truncate"
											style={{ color: "var(--color-text-primary)" }}
										>
											{t(`dashboard.${pendingSession.sessionType}`)}
										</p>
										<p
											className="text-xs"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{t("session_detail.in_progress")} ·{" "}
											{pendingSession.duration} min
										</p>
									</div>
									<button
										type="button"
										onClick={() => {
											if (
												Array.isArray(pendingSession.plannedBlocks) &&
												pendingSession.plannedBlocks.length > 0
											) {
												navigate("/start-practice", {
													state: {
														resumeSession: {
															_id: pendingSession._id,
															sessionType: pendingSession.sessionType,
															duration: pendingSession.duration,
															plannedBlocks: pendingSession.plannedBlocks,
														},
													},
												});
												return;
											}

											navigate("/start-practice");
										}}
										className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shrink-0"
										style={{ backgroundColor: "var(--color-info)" }}
									>
										<RotateCcw size={12} />
										{t("practice.resume")}
									</button>
								</div>
							)}

							{completedSessions.length > 0 ? (
								<>
									<h2
										className="text-[11px] font-bold uppercase tracking-[0.1em]"
										style={{ color: "var(--color-text-muted)" }}
									>
										{t("dashboard.recent_practice")}
									</h2>
									{completedSessions.map((s, i) => (
										<RecentSessionCard key={s._id} session={s} index={i} />
									))}
								</>
							) : (
								!pendingSession && (
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
								)
							)}
						</>
					)}
				</motion.div>
			</div>
		</div>
	);
}

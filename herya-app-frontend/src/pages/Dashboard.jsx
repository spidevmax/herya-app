import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRecommendedSequence } from "@/api/sequences.api";
import { getSessions, getSessionStats } from "@/api/sessions.api";
import CalendarStrip from "@/components/dashboard/CalendarStrip";
import HeroCard from "@/components/dashboard/HeroCard";
import PracticeSnapshotCard from "@/components/dashboard/PracticeSnapshotCard";
import SoftReminderCard from "@/components/dashboard/SoftReminderCard";
import RecentSessionCard from "@/components/dashboard/RecentSessionCard";
import TutorInsightsCard from "@/components/dashboard/TutorInsightsCard";
import AdminQuickCard from "@/components/dashboard/AdminQuickCard";
import { Button, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const ROLE_TONE = {
	admin: { label: "Admin", color: "var(--color-info)", icon: ShieldCheck },
	tutor: { label: "Tutor", color: "var(--color-warning)", icon: ShieldCheck },
};

const getGreetingKey = (hour) => {
	if (hour < 6) return "dashboard.greeting_night";
	if (hour < 12) return "dashboard.greeting_morning";
	if (hour < 17) return "dashboard.greeting_afternoon";
	if (hour < 21) return "dashboard.greeting_evening";
	return "dashboard.greeting_night";
};

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
	const isAdminUser = user?.role === "admin";

	const loadDashboard = useCallback(() => {
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
					if (payload?.reasonKey) {
						setRecommendReason(t(payload.reasonKey, payload.reasonVars || {}));
					} else {
						setRecommendReason(payload?.reason ?? null);
					}
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
	}, [t]);

	useEffect(() => {
		loadDashboard();
	}, [loadDashboard]);

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
	const greetingKey = getGreetingKey(hour);
	const roleTone = ROLE_TONE[user?.role] || null;
	const firstName = user?.name?.split(" ")[0] ?? t("dashboard.default_name");
	const initial = (firstName?.[0] || "·").toUpperCase();

	return (
		<main className="flex flex-col gap-6 pt-4 pb-6 max-w-7xl mx-auto px-4 lg:px-6">
			{/* ── Header ────────────────────────────────────────────────────── */}
			<motion.header
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex items-center justify-between gap-3"
			>
				<div className="flex items-center gap-3 min-w-0">
					<span
						aria-hidden="true"
						className="w-11 h-11 rounded-full flex items-center justify-center font-display text-lg font-bold shrink-0 overflow-hidden"
						style={{
							backgroundColor: "color-mix(in srgb, var(--color-primary) 14%, transparent)",
							color: "var(--color-primary)",
							border: "2px solid color-mix(in srgb, var(--color-primary) 22%, transparent)",
						}}
					>
						{user?.profileImageUrl || user?.avatar ? (
							<img
								src={user.profileImageUrl || user.avatar}
								alt=""
								className="w-full h-full object-cover"
							/>
						) : (
							initial
						)}
					</span>
					<div className="min-w-0">
						<p
							className="text-sm font-medium"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{t(greetingKey)},
						</p>
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-primary)] truncate">
								{firstName}
							</h1>
							{roleTone && (
								<span
									className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
									style={{
										backgroundColor: `color-mix(in srgb, ${roleTone.color} 14%, transparent)`,
										color: roleTone.color,
										border: `1px solid color-mix(in srgb, ${roleTone.color} 28%, transparent)`,
									}}
								>
									<roleTone.icon size={11} aria-hidden="true" />
									{t(`dashboard.role_${user.role}`)}
								</span>
							)}
						</div>
					</div>
				</div>
			</motion.header>

			{error && (
				<motion.section
					role="alert"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="w-full rounded-2xl p-4 flex items-center gap-3"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
					}}
				>
					<AlertTriangle size={20} aria-hidden="true" style={{ color: "var(--color-warning)" }} />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-[var(--color-text-primary)]">
							{t("dashboard.error_title")}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{t("dashboard.error_hint")}
						</p>
					</div>
					<button
						type="button"
						onClick={loadDashboard}
						className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
						style={{
							backgroundColor: "var(--color-warning)",
							color: "white",
						}}
					>
						{t("dashboard.error_retry", "Retry")}
					</button>
				</motion.section>
			)}

			{!isAdminUser && (
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
			)}

			{isAdminUser && (
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.05 }}
				>
					<AdminQuickCard />
				</motion.div>
			)}

			{/* ── Responsive layout ─────────────────────────────────────────
			    Mobile: single column flow — Calendar → Hero → Snapshot → Tutor → Recent
			    Desktop: two independent flex columns so cards pack vertically without gaps.
			────────────────────────────────────────────────────────────────── */}
			<div className="flex flex-col lg:grid lg:grid-cols-[55%_45%] lg:gap-5">
				{/* Mobile-only calendar (shown first on small screens) */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.1 }}
					className="mb-5 lg:hidden"
				>
					<CalendarStrip
						sessionDates={sessionDates}
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions}
						loading={loading}
					/>
				</motion.div>

				{/* Left column (desktop): Hero + Recent */}
				<div className="flex flex-col gap-5 lg:col-start-1">
					{!isAdminUser && (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, delay: 0.15 }}
						>
							<HeroCard
								sequence={recommended}
								reason={recommendReason}
								loading={loading}
							/>
						</motion.div>
					)}

					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.25 }}
						className="flex flex-col gap-3"
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
								<article
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
									<Button
										variant="primary"
										size="sm"
										className="shrink-0"
										onClick={() => {
											const hasBlocks =
												Array.isArray(pendingSession.plannedBlocks) &&
												pendingSession.plannedBlocks.length > 0;
											navigate(
												"/start-practice",
												hasBlocks
													? {
															state: {
																resumeSession: {
																	_id: pendingSession._id,
																	sessionType: pendingSession.sessionType,
																	duration: pendingSession.duration,
																	plannedBlocks: pendingSession.plannedBlocks,
																},
															},
														}
													: undefined,
											);
										}}
									>
										<RotateCcw size={12} aria-hidden="true" />
										{t("practice.resume")}
									</Button>
								</article>
							)}

							{completedSessions.length > 0 ? (
								<section aria-labelledby="recent-practice-heading" className="flex flex-col gap-3">
									<h2
										id="recent-practice-heading"
										className="font-display text-[11px] font-bold uppercase tracking-[0.1em]"
										style={{ color: "var(--color-text-muted)" }}
									>
										{t("dashboard.recent_practice")}
									</h2>
									<ul className="flex flex-col gap-3 list-none m-0 p-0">
										{completedSessions.map((s, i) => (
											<li key={s._id}>
												<RecentSessionCard session={s} index={i} />
											</li>
										))}
									</ul>
								</section>
							) : (
								!pendingSession && (
									<section
										aria-label={t("dashboard.no_sessions_title")}
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
									</section>
								)
							)}
						</>
					)}
				</motion.div>
				</div>

				{/* Right column (desktop): Calendar + Snapshot + Tutor */}
				<div className="hidden lg:flex lg:flex-col gap-5 lg:col-start-2">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.1 }}
					>
						<CalendarStrip
							sessionDates={sessionDates}
							streak={stats?.currentStreak ?? 0}
							weekSessions={weekSessions}
							loading={loading}
						/>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.2 }}
					>
						<PracticeSnapshotCard
							streak={stats?.currentStreak ?? 0}
							weekSessions={weekSessions ?? 0}
							totalPracticeMinutes={totalPracticeMinutes}
							pendingSession={pendingSession}
							loading={loading}
						/>
					</motion.div>

					{isTutorUser && (
						<motion.div
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.35, delay: 0.25 }}
						>
							<TutorInsightsCard tutorInsights={stats?.tutorInsights} />
						</motion.div>
					)}
				</div>

				{/* Mobile-only: Snapshot + Tutor after Recent */}
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.35, delay: 0.2 }}
					className="mt-5 lg:hidden"
				>
					<PracticeSnapshotCard
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions ?? 0}
						totalPracticeMinutes={totalPracticeMinutes}
						pendingSession={pendingSession}
						loading={loading}
					/>
				</motion.div>

				{isTutorUser && (
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, delay: 0.25 }}
						className="mt-5 lg:hidden"
					>
						<TutorInsightsCard tutorInsights={stats?.tutorInsights} />
					</motion.div>
				)}
			</div>
		</main>
	);
}

import { AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendedSequence } from "@/api/sequences.api";
import { getSessionStats, getSessions } from "@/api/sessions.api";
import AdminQuickCard from "@/components/dashboard/AdminQuickCard";
import CalendarStrip from "@/components/dashboard/CalendarStrip";
import HeroCard from "@/components/dashboard/HeroCard";
import PracticeSnapshotCard from "@/components/dashboard/PracticeSnapshotCard";
import RecentSessionCard from "@/components/dashboard/RecentSessionCard";
import SoftReminderCard from "@/components/dashboard/SoftReminderCard";
import TutorInsightsCard from "@/components/dashboard/TutorInsightsCard";
import { Button, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const ROLE_TONE = {
	admin: { label: "Admin", icon: ShieldCheck },
	tutor: { label: "Tutor", color: "var(--alert)", icon: ShieldCheck },
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
		<main
			data-identity="next"
			className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-6 pt-4 lg:px-6"
			style={{ background: "var(--paper)" }}
		>
			{/* ── Header ────────────────────────────────────────────────────── */}
			<header
				className="flex items-center justify-between gap-3"
			>
				<div className="flex items-center gap-3 min-w-0">
					<span
						aria-hidden="true"
						className="display flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden text-lg"
						style={{
							background: "var(--chandra)",
							color: "var(--on-fill)",
							border: "var(--ink-width) solid var(--ink)",
							borderRadius: "999px",
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
							className="text-sm font-bold"
							style={{ color: "var(--ink-soft)" }}
						>
							{t(greetingKey)},
						</p>
						<div className="flex items-center gap-2 flex-wrap">
							<h1 className="display truncate text-[1.9rem]" style={{ color: "var(--ink)" }}>
								{firstName}
							</h1>
							{roleTone && (
								<span
									className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold"
									style={{
										color: "var(--ink)",
										border: "var(--ink-width) solid var(--ink)",
										borderRadius: "var(--radius-block)",
									}}
								>
									<roleTone.icon size={11} aria-hidden="true" />
									{t(`dashboard.role_${user.role}`)}
								</span>
							)}
						</div>
					</div>
				</div>
			</header>

			{error && (
				<section
					role="alert"
					className="w-full ink-block p-4 flex items-center gap-3"
					style={{
						backgroundColor: "var(--paper-raised)",
						border: "1px solid var(--alert)",
					}}
				>
					<AlertTriangle
						size={20}
						aria-hidden="true"
						style={{ color: "var(--alert)" }}
					/>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-[var(--ink)]">
							{t("dashboard.error_title")}
						</p>
						<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
							{t("dashboard.error_hint")}
						</p>
					</div>
					<button
						type="button"
						onClick={loadDashboard}
						className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
						style={{
							backgroundColor: "var(--alert)",
							color: "white",
						}}
					>
						{t("dashboard.error_retry", "Retry")}
					</button>
				</section>
			)}

			{!isAdminUser && (
				<div>
					<SoftReminderCard
						user={user}
						sessions={sessions}
						streak={stats?.currentStreak ?? 0}
					/>
				</div>
			)}

			{isAdminUser && (
				<div>
					<AdminQuickCard />
				</div>
			)}

			{/* ── Responsive layout ─────────────────────────────────────────
			    Mobile: single column flow — Calendar → Hero → Snapshot → Tutor → Recent
			    Desktop: two independent flex columns so cards pack vertically without gaps.
			────────────────────────────────────────────────────────────────── */}
			<div className="flex flex-col lg:grid lg:grid-cols-[55%_45%] lg:gap-5">
				{/* Mobile-only calendar (shown first on small screens) */}
				<div
					className="mb-5 lg:hidden"
				>
					<CalendarStrip
						sessionDates={sessionDates}
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions}
						loading={loading}
					/>
				</div>

				{/* Left column (desktop): Hero + Recent */}
				<div className="flex flex-col gap-5 lg:col-start-1">
					{!isAdminUser && (
						<div
						>
							<HeroCard
								sequence={recommended}
								reason={recommendReason}
								loading={loading}
							/>
						</div>
					)}

					<div
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
										className="ink-block p-4 flex items-center justify-between gap-3"
										style={{
											backgroundColor: "var(--paper-raised)",
											border: "1px solid var(--ink)",
										}}
									>
										<div className="min-w-0">
											<p
												className="mb-1 text-[11px] font-bold"
												style={{ color: "var(--ink-soft)" }}
											>
												{t("dashboard.resume_practice")}
											</p>
											<p
												className="text-sm font-semibold truncate"
												style={{ color: "var(--ink)" }}
											>
												{t(`dashboard.${pendingSession.sessionType}`)}
											</p>
											<p
												className="text-xs"
												style={{ color: "var(--ink-soft)" }}
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
									<section
										aria-labelledby="recent-practice-heading"
										className="flex flex-col gap-3"
									>
										<h2
											id="recent-practice-heading"
											className="text-[11px] font-bold"
											style={{ color: "var(--ink-soft)" }}
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
											className="ink-block p-6 text-center"
										>
											<p
												className="mb-1 text-sm font-bold"
											>
												{t("dashboard.no_sessions_title")}
											</p>
											<p
												className="text-xs"
												style={{ color: "var(--ink-soft)" }}
											>
												{t("dashboard.no_sessions_hint")}
											</p>
										</section>
									)
								)}
							</>
						)}
					</div>
				</div>

				{/* Right column (desktop): Calendar + Snapshot + Tutor */}
				<div className="hidden lg:flex lg:flex-col gap-5 lg:col-start-2">
					<div
					>
						<CalendarStrip
							sessionDates={sessionDates}
							streak={stats?.currentStreak ?? 0}
							weekSessions={weekSessions}
							loading={loading}
						/>
					</div>

					<div
					>
						<PracticeSnapshotCard
							streak={stats?.currentStreak ?? 0}
							weekSessions={weekSessions ?? 0}
							totalPracticeMinutes={totalPracticeMinutes}
							pendingSession={pendingSession}
							loading={loading}
						/>
					</div>

					{isTutorUser && (
						<div
						>
							<TutorInsightsCard tutorInsights={stats?.tutorInsights} />
						</div>
					)}
				</div>

				{/* Mobile-only: Snapshot + Tutor after Recent */}
				<div
					className="mt-5 lg:hidden"
				>
					<PracticeSnapshotCard
						streak={stats?.currentStreak ?? 0}
						weekSessions={weekSessions ?? 0}
						totalPracticeMinutes={totalPracticeMinutes}
						pendingSession={pendingSession}
						loading={loading}
					/>
				</div>

				{isTutorUser && (
					<div
						className="mt-5 lg:hidden"
					>
						<TutorInsightsCard tutorInsights={stats?.tutorInsights} />
					</div>
				)}
			</div>
		</main>
	);
}

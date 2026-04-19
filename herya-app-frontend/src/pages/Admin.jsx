import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	ChevronLeft,
	Users,
	BarChart2,
	BookOpen,
	List,
	Shield,
	UserRound,
} from "lucide-react";
import {
	getAnalyticsDashboard,
	getAdminUsers,
	changeUserRole,
	deleteAdminUser,
} from "@/api/admin.api";
import { getSequences } from "@/api/sequences.api";
import { getPoses } from "@/api/poses.api";
import { getBreathingPatterns } from "@/api/breathing.api";
import {
	TabBar,
	StatCard,
	ConfirmModal,
	SkeletonCard,
	Badge,
} from "@/components/ui";
import PoseManager from "@/components/admin/PoseManager";
import SequenceManager from "@/components/admin/SequenceManager";
import BreathingPatternManager from "@/components/admin/BreathingPatternManager";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

function AdminDashboard({ stats, loading, t }) {
	if (loading)
		return (
			<div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
				{["d1", "d2", "d3"].map((k) => (
					<SkeletonCard key={k} />
				))}
			</div>
		);
	if (!stats) return null;
	return (
		<div className="flex flex-col gap-4">
			<ul className="grid grid-cols-2 gap-3 list-none m-0 p-0">
				<li>
					<StatCard
						icon={<Users size={18} aria-hidden="true" />}
						label={t("admin.dashboard_total_users")}
						value={stats.totalUsers ?? 0}
						color="var(--color-primary)"
					/>
				</li>
				<li>
					<StatCard
						icon={<List size={18} aria-hidden="true" />}
						label={t("admin.dashboard_total_sessions")}
						value={stats.totalSessions ?? 0}
						color="var(--color-primary)"
					/>
				</li>
				<li>
					<StatCard
						icon={<BookOpen size={18} aria-hidden="true" />}
						label={t("admin.dashboard_journal_entries")}
						value={stats.totalJournalEntries ?? 0}
						color="var(--color-info)"
					/>
				</li>
				<li>
					<StatCard
						icon={<BarChart2 size={18} aria-hidden="true" />}
						label={t("admin.dashboard_active_users")}
						value={stats.activeUsers ?? 0}
						color="var(--color-warning)"
					/>
				</li>
			</ul>

			{stats.popularSequences?.length > 0 && (
				<section
					aria-labelledby="admin-popular-sequences-heading"
					className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]"
				>
					<h2 id="admin-popular-sequences-heading" className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
						{t("admin.dashboard_popular_sequences")}
					</h2>
					<ul className="list-none m-0 p-0">
						{stats.popularSequences.map((s, i) => (
							<li
								key={s._id ?? `seq-${i}`}
								className="flex items-center justify-between py-2 border-b border-[var(--color-border-soft)] last:border-0"
							>
								<p className="text-sm text-[var(--color-text-secondary)] truncate flex-1">
									{s.name ?? s.englishName}
								</p>
								<span className="text-xs font-bold text-[var(--color-primary)] ml-2">
									{s.count ?? 0} sesiones
								</span>
							</li>
						))}
					</ul>
				</section>
			)}

			{stats.sessionsByType && (
				<section
					aria-labelledby="admin-sessions-by-type-heading"
					className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]"
				>
					<h2 id="admin-sessions-by-type-heading" className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
						{t("admin.dashboard_sessions_by_type")}
					</h2>
					<dl className="m-0">
						{Object.entries(stats.sessionsByType).map(([type, count]) => (
							<div
								key={type}
								className="flex items-center justify-between py-2 border-b border-[var(--color-border-soft)] last:border-0"
							>
								<dt className="text-sm text-[var(--color-text-secondary)] capitalize">
									{type.replace(/_/g, " ")}
								</dt>
								<dd className="text-xs font-bold text-[var(--color-text-primary)]">
									{count}
								</dd>
							</div>
						))}
					</dl>
				</section>
			)}
		</div>
	);
}

function UserRow({ user, onChangeRole, onDelete, t }) {
	const [nextRole, setNextRole] = useState(user.role);
	const selectId = `role-select-${user._id}`;

	useEffect(() => {
		setNextRole(user.role);
	}, [user.role]);

	return (
		<article aria-label={user.name} className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
			<header className="flex items-center gap-3 mb-3">
				<div aria-hidden="true" className="w-10 h-10 rounded-full bg-[color:var(--color-primary)/0.12] flex items-center justify-center overflow-hidden flex-shrink-0">
					{user.profileImageUrl || user.avatar ? (
						<img
							src={user.profileImageUrl || user.avatar}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<UserRound size={18} style={{ color: "var(--color-primary)" }} />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
						{user.name}
					</p>
					<p className="text-[var(--color-text-muted)] text-xs truncate">
						{user.email}
					</p>
				</div>
				<Badge
					color={
						user.role === "admin"
							? "var(--color-info)"
							: user.role === "tutor"
								? "var(--color-warning)"
								: "var(--color-text-secondary)"
					}
				>
					{user.role}
				</Badge>
			</header>
			<div className="flex gap-2 items-center">
				<label htmlFor={selectId} className="sr-only">
					{t("admin.users_save_role")}
				</label>
				<select
					id={selectId}
					value={nextRole}
					onChange={(e) => setNextRole(e.target.value)}
					className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-[var(--color-border-soft)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
				>
					<option value="user">{t("admin.users_role_standard")}</option>
					<option value="tutor">{t("admin.users_role_tutor")}</option>
					<option value="admin">{t("admin.users_role_admin")}</option>
				</select>
				<button
					type="button"
					disabled={nextRole === user.role}
					onClick={() => onChangeRole(user._id, nextRole)}
					className="py-2 px-3 rounded-xl text-xs font-semibold border border-[var(--color-border-soft)] text-[var(--color-primary)] disabled:opacity-50"
				>
					{t("admin.users_save_role")}
				</button>
				<button
					type="button"
					onClick={() => onDelete(user)}
					className="py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--color-error-bg)] text-[var(--color-danger)]"
				>
					{t("admin.users_delete")}
				</button>
			</div>
		</article>
	);
}

function ContentSection({ title, items, loading, color }) {
	if (loading) return <SkeletonCard lines={3} />;
	const headingId = `content-section-${title.replace(/\s+/g, "-").toLowerCase()}-heading`;
	return (
		<section
			aria-labelledby={headingId}
			className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]"
		>
			<h2 id={headingId} className="font-semibold text-[var(--color-text-primary)] text-sm mb-2">
				{title}{" "}
				<span className="text-[var(--color-text-muted)] font-normal">
					({items.length})
				</span>
			</h2>
			<ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto list-none m-0 p-0">
				{items.slice(0, 20).map((item) => (
					<li
						key={item._id}
						className="flex items-center gap-2 py-1.5 border-b border-[var(--color-surface)] last:border-0"
					>
						<span
							aria-hidden="true"
							className="w-1.5 h-1.5 rounded-full flex-shrink-0"
							style={{ backgroundColor: color }}
						/>
						<p className="text-xs text-[var(--color-text-secondary)] truncate flex-1">
							{item.englishName ?? item.name}
						</p>
						{item.difficulty && (
							<span className="text-[10px] text-[var(--color-text-muted)]">
								{item.difficulty}
							</span>
						)}
					</li>
				))}
			</ul>
		</section>
	);
}

export default function Admin() {
	const { user } = useAuth();
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const VALID_TABS = ["poses", "sequences", "breathing", "dashboard", "users", "content"];
	const initialTab = VALID_TABS.includes(searchParams.get("tab"))
		? searchParams.get("tab")
		: "poses";
	const [tab, setTab] = useState(initialTab);

	useEffect(() => {
		const current = searchParams.get("tab");
		if (current !== tab) {
			const next = new URLSearchParams(searchParams);
			next.set("tab", tab);
			setSearchParams(next, { replace: true });
		}
	}, [tab, searchParams, setSearchParams]);

	const [stats, setStats] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);

	const [users, setUsers] = useState([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [usersFetched, setUsersFetched] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [poses, setPoses] = useState([]);
	const [sequences, setSequences] = useState([]);
	const [patterns, setPatterns] = useState([]);
	const [contentLoading, setContentLoading] = useState(false);
	const [contentFetched, setContentFetched] = useState(false);

	// Redirect if not admin
	useEffect(() => {
		if (user && user.role !== "admin") navigate("/");
	}, [user, navigate]);

	useEffect(() => {
		getAnalyticsDashboard()
			.then((r) => setStats(r.data?.data || r.data))
			.catch(() => setStats(null))
			.finally(() => setStatsLoading(false));
	}, []);

	useEffect(() => {
		if (tab === "users" && !usersFetched) {
			setUsersLoading(true);
			getAdminUsers({ limit: 50 })
				.then((r) => {
					const list = r.data?.data || r.data || [];
					setUsers(Array.isArray(list) ? list : (list.users ?? []));
				})
				.catch(() => setUsers([]))
				.finally(() => {
					setUsersLoading(false);
					setUsersFetched(true);
				});
		}
		if (tab === "content" && !contentFetched) {
			setContentLoading(true);
			Promise.allSettled([
				getPoses({ limit: 100 }),
				getSequences({ limit: 100 }),
				getBreathingPatterns({ limit: 100 }),
			])
				.then(([p, s, b]) => {
					if (p.status === "fulfilled") {
						const l = p.value.data?.data || p.value.data || [];
						setPoses(Array.isArray(l) ? l : []);
					}
					if (s.status === "fulfilled") {
						const l = s.value.data?.data || s.value.data || [];
						setSequences(Array.isArray(l) ? l : []);
					}
					if (b.status === "fulfilled") {
						const l = b.value.data?.data || b.value.data || [];
						setPatterns(Array.isArray(l) ? l : []);
					}
				})
				.finally(() => {
					setContentLoading(false);
					setContentFetched(true);
				});
		}
	}, [tab, usersFetched, contentFetched]);

	const handleChangeRole = async (userId, newRole) => {
		try {
			await changeUserRole(userId, newRole);
			setUsers((prev) =>
				prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
			);
		} catch {
			/* ignore */
		}
	};

	const handleDeleteUser = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await deleteAdminUser(deleteTarget._id);
			setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
			setDeleteTarget(null);
		} catch {
			/* ignore */
		} finally {
			setDeleteLoading(false);
		}
	};

	if (!user || user.role !== "admin") return null;

	return (
		<main className="flex flex-col pt-4 pb-6">
			<header className="flex items-center gap-3 px-4 mb-5">
				<button
					type="button"
					onClick={() => navigate(-1)}
					aria-label={t("admin.title")}
					className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center shadow-[var(--shadow-card)]"
				>
					<ChevronLeft
						size={20}
						aria-hidden="true"
						className="text-[var(--color-text-secondary)]"
					/>
				</button>
				<div className="flex items-center gap-2">
					<Shield size={20} aria-hidden="true" className="text-[var(--color-primary)]" />
					<h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
						{t("admin.title")}
					</h1>
				</div>
			</header>

			<TabBar
				tabs={[
					{ key: "poses", label: t("admin.tab_poses") },
					{ key: "sequences", label: t("admin.tab_sequences") },
					{ key: "breathing", label: t("admin.tab_breathing") },
					{ key: "dashboard", label: t("admin.tab_dashboard") },
					{ key: "users", label: t("admin.tab_users") },
					{ key: "content", label: t("admin.tab_content") },
				]}
				active={tab}
				onSelect={setTab}
				className="px-4 mb-5"
			/>

			<section aria-label={t("admin.title")} className="px-4">
				{tab === "poses" && <PoseManager />}

				{tab === "sequences" && <SequenceManager />}

				{tab === "breathing" && <BreathingPatternManager />}

				{tab === "dashboard" && (
					<AdminDashboard stats={stats} loading={statsLoading} t={t} />
				)}

				{tab === "users" && (
					<ul className="flex flex-col gap-3 list-none m-0 p-0" aria-busy={usersLoading || undefined}>
						{usersLoading
							? ["u1", "u2", "u3"].map((k) => (
									<li key={k}>
										<SkeletonCard />
									</li>
								))
							: users.map((u) => (
									<li key={u._id}>
										<UserRow
											user={u}
											onChangeRole={handleChangeRole}
											onDelete={setDeleteTarget}
											t={t}
										/>
									</li>
								))}
					</ul>
				)}

				{tab === "content" && (
					<div className="flex flex-col gap-4">
						<ContentSection
							title={t("admin.content_poses")}
							items={poses}
							loading={contentLoading}
							color="var(--color-primary)"
						/>
						<ContentSection
							title={t("admin.content_sequences")}
							items={sequences}
							loading={contentLoading}
							color="var(--color-primary)"
						/>
						<ContentSection
							title={t("admin.content_breathing")}
							items={patterns}
							loading={contentLoading}
							color="var(--color-info)"
						/>
						<aside className="bg-[var(--color-surface-card)] rounded-2xl p-4">
							<p className="text-xs text-[var(--color-text-muted)] text-center">
								{t("admin.content_help")}
							</p>
						</aside>
					</div>
				)}
			</section>

			<ConfirmModal
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDeleteUser}
				title={t("admin.users_delete_confirm_title", {
					name: deleteTarget?.name ?? "",
				})}
				description={t("admin.users_delete_confirm_desc")}
				confirmLabel={t("admin.users_delete_confirm")}
				danger
				loading={deleteLoading}
			/>
		</main>
	);
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	ChevronLeft,
	Users,
	BarChart2,
	BookOpen,
	List,
	Shield,
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
import { useAuth } from "@/context/AuthContext";

const TABS = [
	{ key: "dashboard", label: "Dashboard" },
	{ key: "users", label: "Usuarios" },
	{ key: "content", label: "Contenido" },
];

function AdminDashboard({ stats, loading }) {
	if (loading)
		return (
			<div className="flex flex-col gap-3">
				{["d1", "d2", "d3"].map((k) => (
					<SkeletonCard key={k} />
				))}
			</div>
		);
	if (!stats) return null;
	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-3">
				<StatCard
					icon={<Users size={18} />}
					label="Usuarios totales"
					value={stats.totalUsers ?? 0}
					color="var(--color-primary)"
				/>
				<StatCard
					icon={<List size={18} />}
					label="Sesiones totales"
					value={stats.totalSessions ?? 0}
					color="var(--color-primary)"
				/>
				<StatCard
					icon={<BookOpen size={18} />}
					label="Entradas diario"
					value={stats.totalJournalEntries ?? 0}
					color="var(--color-info)"
				/>
				<StatCard
					icon={<BarChart2 size={18} />}
					label="Usuarios activos"
					value={stats.activeUsers ?? 0}
					color="var(--color-warning)"
				/>
			</div>

			{stats.popularSequences?.length > 0 && (
				<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
					<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
						Secuencias populares
					</p>
					{stats.popularSequences.map((s, i) => (
						<div
							key={s._id ?? `seq-${i}`}
							className="flex items-center justify-between py-2 border-b border-[var(--color-border-soft)] last:border-0"
						>
							<p className="text-sm text-[var(--color-text-secondary)] truncate flex-1">
								{s.name ?? s.englishName}
							</p>
							<span className="text-xs font-bold text-[var(--color-primary)] ml-2">
								{s.count ?? 0} sesiones
							</span>
						</div>
					))}
				</div>
			)}

			{stats.sessionsByType && (
				<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
					<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-3">
						Sesiones por tipo
					</p>
					{Object.entries(stats.sessionsByType).map(([type, count]) => (
						<div
							key={type}
							className="flex items-center justify-between py-2 border-b border-[var(--color-border-soft)] last:border-0"
						>
							<p className="text-sm text-[var(--color-text-secondary)] capitalize">
								{type.replace(/_/g, " ")}
							</p>
							<span className="text-xs font-bold text-[var(--color-text-primary)]">
								{count}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function UserRow({ user, onChangeRole, onDelete }) {
	return (
		<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
			<div className="flex items-center gap-3 mb-3">
				<div className="w-10 h-10 rounded-full bg-[color:var(--color-primary)/0.12] flex items-center justify-center overflow-hidden flex-shrink-0">
					{user.avatar ? (
						<img
							src={user.avatar}
							alt={user.name}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-lg">🧘</span>
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
							: "var(--color-text-secondary)"
					}
				>
					{user.role}
				</Badge>
			</div>
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() =>
						onChangeRole(user._id, user.role === "admin" ? "user" : "admin")
					}
					className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border-soft)] text-[var(--color-primary)]"
				>
					{user.role === "admin" ? "→ Usuario" : "→ Admin"}
				</button>
				<button
					type="button"
					onClick={() => onDelete(user)}
					className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[var(--color-error-bg)] text-[var(--color-danger)]"
				>
					Eliminar
				</button>
			</div>
		</div>
	);
}

function ContentSection({ title, items, loading, color }) {
	if (loading) return <SkeletonCard lines={3} />;
	return (
		<div className="bg-[var(--color-surface-card)] rounded-2xl p-4 shadow-[var(--shadow-card)]">
			<p className="font-semibold text-[var(--color-text-primary)] text-sm mb-2">
				{title}{" "}
				<span className="text-[var(--color-text-muted)] font-normal">
					({items.length})
				</span>
			</p>
			<div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
				{items.slice(0, 20).map((item) => (
					<div
						key={item._id}
						className="flex items-center gap-2 py-1.5 border-b border-[var(--color-surface)] last:border-0"
					>
						<div
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
					</div>
				))}
			</div>
		</div>
	);
}

export default function Admin() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [tab, setTab] = useState("dashboard");

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
		<div className="flex flex-col pt-4 pb-6">
			<div className="flex items-center gap-3 px-4 mb-5">
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center shadow-[var(--shadow-card)]"
				>
					<ChevronLeft
						size={20}
						className="text-[var(--color-text-secondary)]"
					/>
				</button>
				<div className="flex items-center gap-2">
					<Shield size={20} className="text-[var(--color-primary)]" />
					<h1
						className="font-display text-xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						Administración
					</h1>
				</div>
			</div>

			<TabBar
				tabs={TABS}
				active={tab}
				onSelect={setTab}
				className="px-4 mb-5"
			/>

			<div className="px-4">
				{tab === "dashboard" && (
					<AdminDashboard stats={stats} loading={statsLoading} />
				)}

				{tab === "users" && (
					<div className="flex flex-col gap-3">
						{usersLoading
							? ["u1", "u2", "u3"].map((k) => <SkeletonCard key={k} />)
							: users.map((u) => (
									<UserRow
										key={u._id}
										user={u}
										onChangeRole={handleChangeRole}
										onDelete={setDeleteTarget}
									/>
								))}
					</div>
				)}

				{tab === "content" && (
					<div className="flex flex-col gap-4">
						<ContentSection
							title="Posturas"
							items={poses}
							loading={contentLoading}
							color="var(--color-primary)"
						/>
						<ContentSection
							title="Secuencias VK"
							items={sequences}
							loading={contentLoading}
							color="var(--color-primary)"
						/>
						<ContentSection
							title="Patrones de respiración"
							items={patterns}
							loading={contentLoading}
							color="var(--color-info)"
						/>
						<div className="bg-[var(--color-surface-card)] rounded-2xl p-4">
							<p className="text-xs text-[var(--color-text-muted)] text-center">
								Para crear o editar contenido usa la API directamente o el panel
								Swagger en /api-docs
							</p>
						</div>
					</div>
				)}
			</div>

			<ConfirmModal
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDeleteUser}
				title={`¿Eliminar a ${deleteTarget?.name}?`}
				description="Se eliminarán todas sus sesiones, entradas de diario y datos. Esta acción es irreversible."
				confirmLabel="Eliminar usuario"
				danger
				loading={deleteLoading}
			/>
		</div>
	);
}

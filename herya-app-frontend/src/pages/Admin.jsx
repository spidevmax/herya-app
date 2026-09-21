import { motion } from "framer-motion";
import { ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	changeUserRole,
	deleteAdminUser,
	getAdminUsers,
} from "@/api/admin.api";
import BreathingPatternManager from "@/components/admin/BreathingPatternManager";
import PoseManager from "@/components/admin/PoseManager";
import SequenceManager from "@/components/admin/SequenceManager";
import { Badge, ConfirmModal, SkeletonCard, TabBar } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

function UserRow({ user, onChangeRole, onDelete, t }) {
	const [nextRole, setNextRole] = useState(user.role);
	const selectId = `role-select-${user._id}`;

	useEffect(() => {
		setNextRole(user.role);
	}, [user.role]);

	return (
		<article aria-label={user.name} className="ink-block p-4">
			<header className="flex items-center gap-3 mb-3">
				<div
					aria-hidden="true"
					className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-[length:var(--ink-width)] border-[var(--ink)] bg-[var(--paper-raised)]"
				>
					{user.profileImageUrl || user.avatar ? (
						<img
							src={user.profileImageUrl || user.avatar}
							alt=""
							className="w-full h-full object-cover"
						/>
					) : (
						<UserRound size={18} style={{ color: "var(--chandra)" }} />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-semibold text-[var(--ink)] text-sm truncate">
						{user.name}
					</p>
					<p className="text-[var(--ink-soft)] text-xs truncate">
						{user.email}
					</p>
				</div>
				<Badge
					color={
						user.role === "admin"
							? "var(--chandra)"
							: user.role === "tutor"
								? "var(--surya)"
								: "var(--ink-soft)"
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
					className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)]"
				>
					<option value="user">{t("admin.users_role_standard")}</option>
					<option value="tutor">{t("admin.users_role_tutor")}</option>
					<option value="admin">{t("admin.users_role_admin")}</option>
				</select>
				<button
					type="button"
					disabled={nextRole === user.role}
					onClick={() => onChangeRole(user._id, nextRole)}
					className="py-2 px-3 rounded-xl text-xs font-semibold border border-[var(--ink)] text-[var(--chandra)] disabled:opacity-50"
				>
					{t("admin.users_save_role")}
				</button>
				<button
					type="button"
					onClick={() => onDelete(user)}
					className="py-2 px-3 rounded-xl text-xs font-semibold bg-[var(--alert-bg)] text-[var(--alert)]"
				>
					{t("admin.users_delete")}
				</button>
			</div>
		</article>
	);
}

export default function Admin() {
	const { user } = useAuth();
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const VALID_TABS = ["poses", "sequences", "breathing", "users"];
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

	const [users, setUsers] = useState([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [usersFetched, setUsersFetched] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	// Redirect if not admin
	useEffect(() => {
		if (user && user.role !== "admin") navigate("/");
	}, [user, navigate]);

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
	}, [tab, usersFetched]);

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

	const hour = new Date().getHours();
	const greetingKey =
		hour < 6
			? "dashboard.greeting_night"
			: hour < 12
				? "dashboard.greeting_morning"
				: hour < 17
					? "dashboard.greeting_afternoon"
					: hour < 21
						? "dashboard.greeting_evening"
						: "dashboard.greeting_night";
	const firstName = user?.name?.split(" ")[0] ?? t("dashboard.default_name");
	const initial = (firstName?.[0] || "·").toUpperCase();

	return (
		<main
			data-identity="next"
			className="flex flex-col pb-6 pt-4"
			style={{ background: "var(--paper)" }}
		>
			<motion.header
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className="flex items-center gap-3 px-4 mb-5"
			>
				<span
					aria-hidden="true"
					className="w-11 h-11 rounded-full flex items-center justify-center font-display text-lg font-bold shrink-0 overflow-hidden"
					style={{
						backgroundColor:
							"color-mix(in srgb, var(--chandra) 14%, transparent)",
						color: "var(--chandra)",
						border:
							"2px solid color-mix(in srgb, var(--chandra) 22%, transparent)",
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
						style={{ color: "var(--ink-soft)" }}
					>
						{t(greetingKey)},
					</p>
					<div className="flex items-center gap-2 flex-wrap">
						<h1 className="font-display text-2xl font-bold tracking-tight text-[var(--chandra)] truncate">
							{firstName}
						</h1>
						<span
							className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold"
							style={{
								color: "var(--ink)",
								border: "var(--ink-width) solid var(--ink)",
								borderRadius: "var(--radius-block)",
							}}
						>
							<ShieldCheck size={11} aria-hidden="true" />
							{t("dashboard.role_admin")}
						</span>
					</div>
				</div>
			</motion.header>

			<TabBar
				tabs={[
					{ key: "poses", label: t("admin.tab_poses") },
					{ key: "sequences", label: t("admin.tab_sequences") },
					{ key: "breathing", label: t("admin.tab_breathing") },
					{ key: "users", label: t("admin.tab_users") },
				]}
				active={tab}
				onSelect={setTab}
				className="px-4 mb-5"
			/>

			<section aria-label={t("admin.title")} className="px-4">
				{tab === "poses" && <PoseManager />}

				{tab === "sequences" && <SequenceManager />}

				{tab === "breathing" && <BreathingPatternManager />}

				{tab === "users" && (
					<ul
						className="flex flex-col gap-3 list-none m-0 p-0"
						aria-busy={usersLoading || undefined}
					>
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

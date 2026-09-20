import { motion } from "framer-motion";
import {
	BarChart2,
	BookOpen,
	List,
	Plus,
	Shield,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnalyticsDashboard } from "@/api/admin.api";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const StatTile = ({ icon, label, value, tone = "var(--chandra)" }) => {
	const Icon = icon;
	return (
		<li
			className="ink-block p-3"
			style={{
				backgroundColor: "var(--paper)",
				border: "var(--ink-width) solid var(--ink)",
			}}
		>
			<div className="flex items-center gap-2 mb-1">
				<span
					aria-hidden="true"
					className="w-7 h-7 rounded-lg flex items-center justify-center"
					style={{
						border: `var(--ink-width) solid ${tone}`,
					}}
				>
					<Icon size={14} style={{ color: tone }} />
				</span>
				<p
					className="text-[11px] font-bold"
					style={{ color: "var(--ink-soft)" }}
				>
					{label}
				</p>
			</div>
			<p
				className="text-lg font-bold"
				style={{ color: "var(--ink)" }}
			>
				{value}
			</p>
		</li>
	);
};

const QuickAction = ({ icon, label, onClick, tone }) => {
	const Icon = icon;
	return (
		<button
			type="button"
			onClick={onClick}
			className="ink-block ink-block--press flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-bold"
			style={{
				backgroundColor: tone,
				color: "var(--on-fill)",
				border: "var(--ink-width) solid var(--ink)",
				"--tw-ring-color": "var(--ink)",
			}}
		>
			<Plus size={14} aria-hidden="true" />
			<Icon size={14} aria-hidden="true" />
			<span>{label}</span>
		</button>
	);
};

export default function AdminQuickCard() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		getAnalyticsDashboard()
			.then((r) => {
				if (!mounted) return;
				setStats(r.data?.data || r.data || null);
			})
			.catch(() => mounted && setStats(null))
			.finally(() => mounted && setLoading(false));
		return () => {
			mounted = false;
		};
	}, []);

	const goAdmin = (tab) => navigate(`/admin?tab=${tab}`);

	return (
		<motion.section
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			aria-labelledby="admin-quick-title"
			className="ink-block p-4"
			style={{
				backgroundColor: "var(--paper-raised)",
				border: "var(--ink-width) solid var(--ink)",
			}}
		>
			<header className="flex items-start justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.admin_overview_label", "Admin overview")}
					</p>
					<h2
						id="admin-quick-title"
						className="font-display text-lg font-bold"
						style={{ color: "var(--ink)" }}
					>
						{t("dashboard.admin_overview_title", "Platform at a glance")}
					</h2>
				</div>
				<span
					aria-hidden="true"
					className="w-9 h-9 rounded-xl flex items-center justify-center"
					style={{
						background: "var(--chandra)",
						border: "var(--ink-width) solid var(--ink)",
						borderRadius: "var(--radius-block)",
					}}
				>
					<Shield size={18} style={{ color: "var(--on-fill)" }} />
				</span>
			</header>

			{loading ? (
				<ul
					className="grid grid-cols-2 gap-2 mb-3 list-none m-0 p-0"
					aria-busy="true"
				>
					{["s1", "s2", "s3", "s4"].map((k) => (
						<li key={k} className="skeleton h-16 rounded-2xl" />
					))}
				</ul>
			) : (
				<ul className="grid grid-cols-2 gap-2 mb-3 list-none m-0 p-0">
					<StatTile
						icon={Users}
						label={t("admin.dashboard_total_users")}
						value={stats?.totalUsers ?? 0}
						tone="var(--chandra)"
					/>
					<StatTile
						icon={BarChart2}
						label={t("admin.dashboard_active_users")}
						value={stats?.activeUsers ?? 0}
						tone="var(--surya)"
					/>
					<StatTile
						icon={List}
						label={t("admin.dashboard_total_sessions")}
						value={stats?.totalSessions ?? 0}
						tone="var(--chandra)"
					/>
					<StatTile
						icon={BookOpen}
						label={t("admin.dashboard_journal_entries")}
						value={stats?.totalJournalEntries ?? 0}
						tone="var(--surya)"
					/>
				</ul>
			)}

			<nav
				aria-label={t("dashboard.admin_quick_actions", "Admin quick actions")}
			>
				<ul className="flex flex-wrap gap-2 list-none m-0 p-0 mb-3">
					<li>
						<QuickAction
							icon={Users}
							label={t("admin.tab_poses")}
							onClick={() => goAdmin("poses")}
							tone="var(--chandra)"
						/>
					</li>
					<li>
						<QuickAction
							icon={List}
							label={t("admin.tab_sequences")}
							onClick={() => goAdmin("sequences")}
							tone="var(--chandra)"
						/>
					</li>
					<li>
						<QuickAction
							icon={BookOpen}
							label={t("admin.tab_breathing")}
							onClick={() => goAdmin("breathing")}
							tone="var(--surya)"
						/>
					</li>
				</ul>
			</nav>

			<button
				type="button"
				onClick={() => navigate("/admin")}
				className="cursor-pointer text-sm font-bold underline"
				style={{ color: "var(--ink)" }}
			>
				{t("dashboard.admin_open_panel", "Open admin panel")}
			</button>
		</motion.section>
	);
}

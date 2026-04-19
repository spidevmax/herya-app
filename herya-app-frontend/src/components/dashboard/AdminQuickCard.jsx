import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	Users,
	List,
	BookOpen,
	BarChart2,
	Plus,
	Shield,
	ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAnalyticsDashboard } from "@/api/admin.api";
import { useLanguage } from "@/context/LanguageContext";

const StatTile = ({ icon, label, value, tone = "var(--color-primary)" }) => {
	const Icon = icon;
	return (
	<li className="rounded-2xl p-3"
		style={{
			backgroundColor: "var(--color-surface)",
			border: "1px solid var(--color-border-soft)",
		}}
	>
		<div className="flex items-center gap-2 mb-1">
			<span
				aria-hidden="true"
				className="w-7 h-7 rounded-lg flex items-center justify-center"
				style={{ backgroundColor: `color-mix(in srgb, ${tone} 12%, transparent)` }}
			>
				<Icon size={14} style={{ color: tone }} />
			</span>
			<p
				className="text-[10px] font-bold uppercase tracking-[0.1em]"
				style={{ color: "var(--color-text-muted)" }}
			>
				{label}
			</p>
		</div>
		<p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
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
		className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
		style={{
			backgroundColor: `color-mix(in srgb, ${tone} 10%, transparent)`,
			color: tone,
			border: `1px solid color-mix(in srgb, ${tone} 28%, transparent)`,
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
			className="rounded-3xl p-4 shadow-[var(--shadow-card)]"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<header className="flex items-start justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.admin_overview_label", "Admin overview")}
					</p>
					<h2
						id="admin-quick-title"
						className="font-display text-lg font-bold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("dashboard.admin_overview_title", "Platform at a glance")}
					</h2>
				</div>
				<span
					aria-hidden="true"
					className="w-9 h-9 rounded-xl flex items-center justify-center"
					style={{
						backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
					}}
				>
					<Shield size={18} style={{ color: "var(--color-primary)" }} />
				</span>
			</header>

			{loading ? (
				<ul className="grid grid-cols-2 gap-2 mb-3 list-none m-0 p-0" aria-busy="true">
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
						tone="var(--color-primary)"
					/>
					<StatTile
						icon={BarChart2}
						label={t("admin.dashboard_active_users")}
						value={stats?.activeUsers ?? 0}
						tone="var(--color-warning)"
					/>
					<StatTile
						icon={List}
						label={t("admin.dashboard_total_sessions")}
						value={stats?.totalSessions ?? 0}
						tone="var(--color-info)"
					/>
					<StatTile
						icon={BookOpen}
						label={t("admin.dashboard_journal_entries")}
						value={stats?.totalJournalEntries ?? 0}
						tone="var(--color-secondary)"
					/>
				</ul>
			)}

			<nav aria-label={t("dashboard.admin_quick_actions", "Admin quick actions")}>
				<ul className="flex flex-wrap gap-2 list-none m-0 p-0 mb-3">
					<li>
						<QuickAction
							icon={Users}
							label={t("admin.tab_poses")}
							onClick={() => goAdmin("poses")}
							tone="var(--color-primary)"
						/>
					</li>
					<li>
						<QuickAction
							icon={List}
							label={t("admin.tab_sequences")}
							onClick={() => goAdmin("sequences")}
							tone="var(--color-info)"
						/>
					</li>
					<li>
						<QuickAction
							icon={BookOpen}
							label={t("admin.tab_breathing")}
							onClick={() => goAdmin("breathing")}
							tone="var(--color-secondary)"
						/>
					</li>
				</ul>
			</nav>

			<button
				type="button"
				onClick={() => navigate("/admin")}
				className="inline-flex items-center gap-1.5 text-xs font-semibold"
				style={{ color: "var(--color-primary)" }}
			>
				{t("dashboard.admin_open_panel", "Open admin panel")}
				<ArrowRight size={14} aria-hidden="true" />
			</button>
		</motion.section>
	);
}

import { motion } from "framer-motion";
import { BookOpen, PlayCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "@/utils/helpers";
import { useLanguage } from "@/context/LanguageContext";

const Stat = ({ label, value }) => (
	<div
		className="rounded-2xl p-3"
		style={{
			backgroundColor: "var(--color-surface)",
			border: "1px solid var(--color-border-soft)",
		}}
	>
		<p
			className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
			style={{ color: "var(--color-text-muted)" }}
		>
			{label}
		</p>
		<p
			className="text-lg font-bold"
			style={{ color: "var(--color-text-primary)" }}
		>
			{value}
		</p>
	</div>
);

export default function PracticeSnapshotCard({
	streak = 0,
	weekSessions = 0,
	totalPracticeMinutes = 0,
	pendingSession = null,
}) {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const hasPendingSession = Boolean(pendingSession);
	const nextActionLabel = hasPendingSession
		? t("dashboard.resume_practice")
		: t("dashboard.quick_start");

	const handlePrimaryAction = () => {
		if (hasPendingSession) {
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
			return;
		}

		navigate("/start-practice");
	};

	return (
		<motion.div
			className="rounded-3xl p-4 shadow-[var(--shadow-card)]"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold uppercase tracking-[0.1em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("dashboard.quick_snapshot_title")}
					</p>
					<p
						className="text-sm"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("dashboard.quick_snapshot_subtitle")}
					</p>
				</div>
				<div
					className="w-8 h-8 rounded-xl flex items-center justify-center"
					style={{ backgroundColor: "var(--color-surface)" }}
				>
					<Sparkles size={16} style={{ color: "var(--color-primary)" }} />
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 mb-3">
				<Stat label={t("dashboard.streak")} value={streak} />
				<Stat label={t("dashboard.quick_snapshot_week")} value={weekSessions} />
				<Stat
					label={t("dashboard.hours")}
					value={format.duration(totalPracticeMinutes) || "0m"}
				/>
			</div>

			<div
				className="rounded-2xl p-3 mb-3"
				style={{
					backgroundColor: "var(--color-surface)",
					border: "1px solid var(--color-border-soft)",
				}}
			>
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("dashboard.recommended")}
				</p>
				<p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
					{hasPendingSession
						? t(`dashboard.${pendingSession.sessionType}`)
						: t("dashboard.reminder_short_practice")}
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-2">
				<button
					type="button"
					onClick={handlePrimaryAction}
					className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
					style={{ backgroundColor: "var(--color-primary)" }}
				>
					<PlayCircle size={16} />
					{nextActionLabel}
				</button>
				<button
					type="button"
					onClick={() => navigate("/journal")}
					className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-soft)",
					}}
				>
					<BookOpen size={16} />
					{t("dashboard.quick_garden")}
				</button>
			</div>
		</motion.div>
	);
}

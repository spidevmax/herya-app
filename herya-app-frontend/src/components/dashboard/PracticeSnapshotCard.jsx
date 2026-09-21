import { BookOpen, PlayCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";
import { format } from "@/utils/helpers";

const Stat = ({ label, value }) => (
	<div
		className="ink-block p-3"
		style={{
			backgroundColor: "var(--paper)",
			border: "var(--ink-width) solid var(--ink)",
		}}
	>
		<p
			className="text-[11px] font-bold mb-1"
			style={{ color: "var(--ink-soft)" }}
		>
			{label}
		</p>
		<p className="text-lg font-bold" style={{ color: "var(--ink)" }}>
			{value}
		</p>
	</div>
);

const PracticeSnapshotCard = ({
	streak = 0,
	weekSessions = 0,
	totalPracticeMinutes = 0,
	pendingSession = null,
	loading = false,
}) => {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const hasPendingSession = Boolean(pendingSession);

	if (loading) {
		return (
			<section
				data-identity="next"
				aria-busy="true"
				aria-label={t("dashboard.quick_snapshot_title")}
				className="ink-block p-4 flex flex-col gap-3"
				style={{
					backgroundColor: "var(--paper-raised)",
					border: "var(--ink-width) solid var(--ink)",
				}}
			>
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1">
						<span
							className="skeleton h-3 w-32 rounded-lg block mb-1"
							aria-hidden="true"
						/>
						<span
							className="skeleton h-3 w-48 rounded-lg block"
							aria-hidden="true"
						/>
					</div>
					<span className="skeleton w-8 h-8 rounded-xl" aria-hidden="true" />
				</div>
				<div className="grid grid-cols-3 gap-2" aria-hidden="true">
					{["a", "b", "c"].map((k) => (
						<span key={k} className="skeleton h-16 rounded-2xl block" />
					))}
				</div>
				<span className="skeleton h-14 rounded-2xl block" aria-hidden="true" />
				<div className="flex gap-2" aria-hidden="true">
					<span className="skeleton h-10 flex-1 rounded-xl block" />
					<span className="skeleton h-10 flex-1 rounded-xl block" />
				</div>
			</section>
		);
	}
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
		<section
			data-identity="next"
			aria-label={t("dashboard.quick_snapshot_title")}
			className="ink-block p-4"
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div>
					<p
						className="text-[11px] font-bold"
						style={{ color: "var(--ink-soft)" }}
					>
						{t("dashboard.quick_snapshot_title")}
					</p>
					<p className="text-sm" style={{ color: "var(--ink-soft)" }}>
						{t("dashboard.quick_snapshot_subtitle")}
					</p>
				</div>
				<div
					className="w-8 h-8 rounded-xl flex items-center justify-center"
					style={{ backgroundColor: "var(--paper)" }}
				>
					<Sparkles
						size={16}
						aria-hidden="true"
						style={{ color: "var(--ink)" }}
					/>
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
				className="ink-block p-3 mb-3"
				style={{
					backgroundColor: "var(--paper)",
					border: "var(--ink-width) solid var(--ink)",
				}}
			>
				<p
					className="text-[11px] font-bold mb-1"
					style={{ color: "var(--ink-soft)" }}
				>
					{t("dashboard.recommended")}
				</p>
				<p className="text-sm" style={{ color: "var(--ink-soft)" }}>
					{hasPendingSession
						? t(`dashboard.${pendingSession.sessionType}`)
						: t("dashboard.reminder_short_practice")}
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-2">
				{/* Not the shared Button: that component still carries the old
				    tokens and renders a blue gradient inside an ink card. */}
				<button
					type="button"
					onClick={handlePrimaryAction}
					className="ink-block ink-block--press flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold"
					style={{
						background: "var(--surya)",
						color: "var(--on-fill)",
						cursor: "pointer",
					}}
				>
					<PlayCircle size={16} aria-hidden="true" />
					{nextActionLabel}
				</button>
				<button
					type="button"
					onClick={() => navigate("/journal")}
					className="ink-block ink-block--press flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-bold"
					style={{ cursor: "pointer" }}
				>
					<BookOpen size={16} aria-hidden="true" />
					{t("dashboard.quick_garden")}
				</button>
			</div>
		</section>
	);
};

export default PracticeSnapshotCard;

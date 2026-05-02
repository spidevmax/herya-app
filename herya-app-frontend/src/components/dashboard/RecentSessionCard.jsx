import { motion } from "framer-motion";
import {
	CheckCircle,
	Clock,
	Leaf,
	PersonStanding,
	Star,
	Wind,
	XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { VK_FAMILY_MAP } from "@/utils/constants";
import { format } from "@/utils/helpers";
import { colorMix } from "@/utils/libraryHelpers";

export default function RecentSessionCard({ session, index = 0 }) {
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
	const family = session.vkSequence?.family
		? VK_FAMILY_MAP[session.vkSequence.family]
		: null;
	const TYPE_ICON_MAP = {
		vk_sequence: PersonStanding,
		pranayama: Wind,
		meditation: Leaf,
		complete_practice: Star,
	};
	const SessionTypeIcon = TYPE_ICON_MAP[session.sessionType] || PersonStanding;
	const color = family?.color || "var(--color-primary)";

	return (
		<motion.article
			initial={{ opacity: 0, x: -16 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.08 }}
			onClick={() => navigate(`/sessions/${session._id}`)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					navigate(`/sessions/${session._id}`);
				}
			}}
			role="button"
			tabIndex={0}
			className="flex items-center gap-3 rounded-2xl p-4 shadow-[var(--shadow-card)] cursor-pointer active:scale-[0.98] transition-transform"
			style={{ backgroundColor: "var(--color-surface-card)" }}
		>
			<div
				className="w-1.5 self-stretch rounded-full flex-shrink-0"
				style={{ backgroundColor: color, minHeight: 40 }}
			/>
			<div
				className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
				style={{ backgroundColor: colorMix(color, 12) }}
			>
				{family?.emoji ? (
					<span className="text-xl">{family.emoji}</span>
				) : (
					<SessionTypeIcon size={20} strokeWidth={2.2} style={{ color }} />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="font-semibold text-sm truncate"
					style={{ color: "var(--color-text-primary)" }}
				>
					{session.vkSequence?.englishName ||
						t(`dashboard.${session.sessionType}`) ||
						t("dashboard.sessions")}
				</p>
				<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
					{format.date(session.date || session.createdAt, lang)}
				</p>
			</div>
			<div className="flex flex-col items-end gap-1 flex-shrink-0">
				<div
					className="flex items-center gap-1 text-xs"
					style={{ color: "var(--color-text-secondary)" }}
				>
					<Clock size={11} />
					{session.duration} min
				</div>
				{session.completed ? (
					<CheckCircle size={14} style={{ color: "var(--color-success)" }} />
				) : (
					<XCircle size={14} style={{ color: "var(--color-text-muted)" }} />
				)}
			</div>
		</motion.article>
	);
}

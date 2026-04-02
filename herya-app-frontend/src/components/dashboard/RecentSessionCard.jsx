import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SESSION_TYPES, VK_FAMILY_MAP } from "@/utils/constants";
import { format } from "@/utils/helpers";

export default function RecentSessionCard({ session, index = 0 }) {
	const navigate = useNavigate();
	const family = session.vkSequence?.family
		? VK_FAMILY_MAP[session.vkSequence.family]
		: null;
	const sessionType = SESSION_TYPES.find((s) => s.value === session.sessionType);
	const color = family?.color || "var(--color-primary)";

	return (
		<motion.div
			initial={{ opacity: 0, x: -16 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ delay: index * 0.08 }}
			onClick={() => navigate(`/sessions/${session._id}`)}
			className="flex items-center gap-3 rounded-2xl p-4 shadow-[var(--shadow-card)] cursor-pointer active:scale-[0.98] transition-transform"
			style={{ backgroundColor: "var(--color-surface-card)" }}
		>
			<div
				className="w-1.5 self-stretch rounded-full flex-shrink-0"
				style={{ backgroundColor: color, minHeight: 40 }}
			/>
			<div
				className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
				style={{ backgroundColor: `${color}20` }}
			>
				{family?.emoji || sessionType?.icon || "🧘"}
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="font-semibold text-sm truncate"
					style={{ color: "var(--color-text-primary)" }}
				>
					{session.vkSequence?.englishName || sessionType?.label || "Session"}
				</p>
				<p
					className="text-xs"
					style={{ color: "var(--color-text-muted)" }}
				>
					{format.date(session.date || session.createdAt)}
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
		</motion.div>
	);
}

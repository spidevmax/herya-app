import {
	Check,
	Clock,
	Leaf,
	PersonStanding,
	Star,
	Wind,
	X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "@/utils/helpers";
import "@/styles/identity.css";

const TYPE_ICON_MAP = {
	vk_sequence: PersonStanding,
	pranayama: Wind,
	meditation: Leaf,
	complete_practice: Star,
};

/*
 * Session type maps to a breath channel rather than to a per-family colour.
 * Posture work is effort (surya), breathwork is rest (chandra), meditation
 * carries no fill. The same mapping the krama ladder uses, so a session reads
 * the same wherever it appears.
 */
const TYPE_FILL = {
	vk_sequence: "var(--surya)",
	complete_practice: "var(--surya)",
	pranayama: "var(--chandra)",
	meditation: "transparent",
};

const RecentSessionCard = ({ session }) => {
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
	const SessionTypeIcon = TYPE_ICON_MAP[session.sessionType] || PersonStanding;
	const fill = TYPE_FILL[session.sessionType] ?? "transparent";
	const open = () => navigate(`/sessions/${session._id}`);

	/*
	 * A real button rather than an article carrying role="button": the element
	 * is entirely a click target, and native buttons already handle Enter,
	 * Space and focus without a keydown handler.
	 */
	return (
		<button
			type="button"
			data-identity="next"
			onClick={open}
			className="ink-block ink-block--press flex w-full items-center gap-3 p-3 text-left"
			style={{ cursor: "pointer" }}
		>
			<span
				aria-hidden="true"
				className="flex h-10 w-10 shrink-0 items-center justify-center"
				style={{
					background: fill,
					border: "var(--ink-width) solid var(--ink)",
					borderRadius: "var(--radius-block)",
					color: fill === "transparent" ? "var(--ink)" : "var(--on-fill)",
				}}
			>
				<SessionTypeIcon size={19} strokeWidth={2.1} />
			</span>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-bold">
					{session.vkSequence?.englishName ||
						t(`dashboard.${session.sessionType}`) ||
						t("dashboard.sessions")}
				</p>
				<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
					{format.date(session.date || session.createdAt, lang)}
				</p>
			</div>

			<div className="flex shrink-0 flex-col items-end gap-1">
				<span
					className="flex items-center gap-1 text-xs font-bold"
					style={{ color: "var(--ink-soft)" }}
				>
					<Clock size={11} aria-hidden="true" />
					{session.duration} min
				</span>
				{session.completed ? (
					<Check size={15} aria-hidden="true" style={{ color: "var(--ink)" }} />
				) : (
					<X
						size={15}
						aria-hidden="true"
						style={{ color: "var(--ink-soft)" }}
					/>
				)}
			</div>
		</button>
	);
};

export default RecentSessionCard;

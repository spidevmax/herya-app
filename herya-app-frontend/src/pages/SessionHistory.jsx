import { motion } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	Leaf,
	PersonStanding,
	Star,
	Wind,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessions } from "@/api/sessions.api";
import { FilterChips, SkeletonCard, EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { VK_FAMILIES } from "@/utils/constants";
import { format } from "@/utils/helpers";
import { colorMix } from "@/utils/libraryHelpers";

const TYPE_ICONS = {
	vk_sequence: PersonStanding,
	pranayama: Wind,
	meditation: Leaf,
	complete_practice: Star,
};

const TYPE_COLORS = {
	vk_sequence: "var(--color-primary)",
	pranayama: "var(--color-primary)",
	meditation: "var(--color-info)",
	complete_practice: "var(--color-warning)",
};

const TYPE_FILTER_KEYS = [
	"",
	"vk_sequence",
	"pranayama",
	"meditation",
	"complete_practice",
];

const TYPE_FILTER_I18N = {
	"": "session_history.filter_all",
	vk_sequence: "session_history.filter_vk",
	pranayama: "session_history.filter_pranayama",
	meditation: "session_history.filter_meditation",
	complete_practice: "session_history.filter_complete",
};

function SessionCard({ session, index, onClick, t, lang }) {
	const color = TYPE_COLORS[session.sessionType] || "var(--color-primary)";
	const TypeIcon = TYPE_ICONS[session.sessionType] || PersonStanding;
	const label = t(
		TYPE_FILTER_I18N[session.sessionType] ||
			`practice.type_${session.sessionType}`,
	);
	const family = session.vkFamily
		? VK_FAMILIES.find((f) => f.key === session.vkFamily)
		: null;
	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.04, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] rounded-2xl p-4 flex items-center gap-4 shadow-[var(--shadow-soft)] w-full text-left"
		>
			<div
				className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
				style={{ backgroundColor: colorMix(color, 8) }}
			>
				{family?.emoji ? (
					<span className="text-2xl">{family.emoji}</span>
				) : (
					<TypeIcon size={24} strokeWidth={2.2} style={{ color }} />
				)}
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-semibold text-[var(--color-text-primary)] text-sm truncate">
					{label}
				</p>
				<p className="text-[var(--color-text-muted)] text-xs mt-0.5">
					{format.date(session.date || session.createdAt, lang)}
				</p>
				{session.duration && (
					<p className="text-[var(--color-text-secondary)] text-xs">
						{format.duration(session.duration)}
					</p>
				)}
			</div>
			<div className="flex items-center gap-2 flex-shrink-0">
				{session.completed && (
					<span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
				)}
				<ChevronRight size={16} className="text-[var(--color-text-muted)]" />
			</div>
		</motion.button>
	);
}

export default function SessionHistory() {
	const navigate = useNavigate();
	const { t, lang } = useLanguage();
	const [sessions, setSessions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [type, setType] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const PAGE_SIZE = 15;

	const fetchSessions = useCallback(() => {
		setLoading(true);
		getSessions({ sessionType: type || undefined, limit: PAGE_SIZE, page })
			.then((r) => {
				const data = r.data?.data || r.data || {};
				const list = Array.isArray(data)
					? data
					: (data.sessions ?? data.items ?? []);
				setSessions(list);
				setHasMore((data.pagination?.total ?? list.length) > page * PAGE_SIZE);
			})
			.catch(() => setSessions([]))
			.finally(() => setLoading(false));
	}, [type, page]);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	return (
		<main className="flex flex-col pt-4 pb-6 min-h-0">
			<header className="px-4 mb-4">
				<div className="flex items-center gap-3 mb-4">
					<button
						type="button"
						onClick={() => navigate(-1)}
						aria-label={t("session.back_home")}
						className="w-9 h-9 rounded-full bg-[var(--color-surface-card)] flex items-center justify-center shadow-sm"
					>
						<ChevronLeft
							size={20}
							aria-hidden="true"
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
						{t("session_history.title")}
					</h1>
				</div>
				<FilterChips
					options={TYPE_FILTER_KEYS.map((key) => ({
						key,
						label: t(TYPE_FILTER_I18N[key]),
						color: TYPE_COLORS[key] || "var(--color-primary)",
					}))}
					selected={type}
					onSelect={(nextType) => {
						setType(nextType);
						setPage(1);
					}}
				/>
			</header>

			{loading ? (
				<div className="px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3" aria-busy="true" aria-live="polite">
					{["s1", "s2", "s3", "s4"].map((k) => <SkeletonCard key={k} />)}
				</div>
			) : sessions.length === 0 ? (
				<div className="px-4">
					<EmptyState
						icon={
							<ClipboardList
								size={52}
								style={{ color: "var(--color-primary)" }}
							/>
						}
						title={t("session_history.empty_title")}
						description={t("session_history.empty_hint")}
					/>
				</div>
			) : (
				<ul className="px-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 list-none m-0 p-0">
					{sessions.map((s, i) => (
						<li key={s._id}>
							<SessionCard
								session={s}
								index={i}
								onClick={() => navigate(`/sessions/${s._id}`)}
								t={t}
								lang={lang}
							/>
						</li>
					))}
				</ul>
			)}

			{!loading && hasMore && (
				<div className="px-4 mt-3">
					<button
						type="button"
						onClick={() => setPage((p) => p + 1)}
						className="w-full py-3 rounded-2xl border border-[var(--color-border-soft)] text-[var(--color-primary)] text-sm font-semibold"
					>
						{t("session_history.load_more")}
					</button>
				</div>
			)}
		</main>
	);
}

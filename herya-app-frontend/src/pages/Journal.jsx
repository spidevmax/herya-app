import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getJournalEntries } from "@/api/journalEntries.api";
import { Button, EmptyState, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { MOOD_COLORS } from "@/utils/constants";
import { format } from "@/utils/helpers";

const MOOD_EMOJIS_MAP = { 1: "😔", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

function JournalCard({ entry, index, onClick }) {
	const { t } = useLanguage();
	const moodVal = entry.moodBefore ?? entry.energyBefore;
	const moods = entry.moodAfter || entry.moodBefore || [];
	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.04, 0.3) }}
			onClick={onClick}
			className="bg-[var(--color-surface-card)] rounded-2xl p-4 flex items-start gap-3 shadow-[var(--shadow-soft)] w-full text-left"
		>
			<div className="w-11 h-11 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center text-2xl flex-shrink-0">
				{MOOD_EMOJIS_MAP[moodVal] ?? "🌱"}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between mb-1">
					<p className="text-xs text-[var(--color-text-muted)]">
						{format.date(entry.date || entry.createdAt)}
					</p>
					<ChevronRight size={14} className="text-[var(--color-text-muted)]" />
				</div>
				{moods.length > 0 && (
					<div className="flex gap-1 mb-1.5 flex-wrap">
						{moods.slice(0, 3).map((m) => {
							const moodColor = MOOD_COLORS[m] ?? "var(--color-info)";
							return (
								<span
									key={m}
									className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
									style={{
										backgroundColor: `color-mix(in srgb, ${moodColor} 20%, transparent)`,
										color: moodColor,
									}}
								>
									{m}
								</span>
							);
						})}
					</div>
				)}
				{entry.reflection ? (
					<p className="text-[var(--color-text-secondary)] text-xs leading-relaxed line-clamp-2">
						{entry.reflection}
					</p>
				) : (
					<p className="text-[var(--color-text-muted)] text-xs italic">
						{t("journal.no_reflection")}
					</p>
				)}
			</div>
		</motion.button>
	);
}

export default function Journal() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getJournalEntries({ limit: 50 })
			.then((r) => {
				// Backend returns { journals, pagination }
				const payload = r.data?.data || r.data || {};
				const list = payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries(list);
			})
			.catch(() => setEntries([]))
			.finally(() => setLoading(false));
	}, []);

	const entryCount = entries.length;
	const entryLabel =
		entryCount !== 1
			? t("journal.entries_plural")
			: t("journal.entries_singular");

	return (
		<div className="flex flex-col pt-4 pb-6">
			<div className="flex items-center justify-between px-4 mb-5">
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						{t("journal.title")}
					</h1>
					<p className="text-[var(--color-text-muted)] text-sm">
						{entryCount} {entryLabel}
					</p>
				</div>
				<button
					type="button"
					onClick={() => navigate("/journal/new")}
					className="w-11 h-11 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-brand)]"
				>
					<Plus size={22} className="text-white" />
				</button>
			</div>

			<div className="px-4 flex flex-col gap-3">
				{loading ? (
					["j1", "j2", "j3"].map((k) => <SkeletonCard key={k} />)
				) : entries.length === 0 ? (
					<EmptyState
						illustration="📔"
						title={t("journal.empty_title")}
						description={t("journal.empty_hint")}
						action={
							<Button
								onClick={() => navigate("/journal/new")}
								variant="primary"
							>
								{t("journal.empty_action")}
							</Button>
						}
					/>
				) : (
					entries.map((e, i) => (
						<JournalCard
							key={e._id}
							entry={e}
							index={i}
							onClick={() => navigate(`/journal/${e._id}/edit`)}
						/>
					))
				)}
			</div>
		</div>
	);
}

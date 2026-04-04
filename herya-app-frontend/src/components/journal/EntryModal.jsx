import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MOOD_COLORS } from "@/utils/constants";
import { format } from "@/utils/helpers";
import { useLanguage } from "@/context/LanguageContext";

const toMoodTokens = (moods, prefix) => {
	const seen = {};
	return moods.map((mood) => {
		seen[mood] = (seen[mood] ?? 0) + 1;
		return {
			mood,
			key: `${prefix}-${mood}-${seen[mood]}`,
		};
	});
};

export const EntryModal = ({ entry, isOpen, onClose }) => {
	const { t } = useLanguage();
	const navigate = useNavigate();

	if (!entry) return null;

	const moods = entry.moodAfter || entry.moodBefore || [];
	const created = format.date(entry.date || entry.createdAt);

	const translateMoodLabel = (mood) => {
		const key = `session.moods.${mood}`;
		const translated = t(key);
		return translated === key ? mood : translated;
	};

	const translateWithFallback = (key, fallback) => {
		const translated = t(key);
		return translated === key ? fallback : translated;
	};

	const durationMinutes = Math.max(
		1,
		Math.round(Number(entry?.session?.duration) || 0),
	);

	const resolveJournalEntryId = (value) => {
		if (!value) return null;
		if (typeof value === "string") return value;
		if (typeof value === "number") return String(value);
		if (typeof value === "object") {
			if (value._id) return String(value._id);
			if (value.id) return String(value.id);
			return null;
		}
		return null;
	};

	const entryId =
		resolveJournalEntryId(entry?._id) ||
		resolveJournalEntryId(entry?.id) ||
		resolveJournalEntryId(entry?.journalEntryId) ||
		null;
	const moodTokens = toMoodTokens(moods, `entry-${entryId || created}`);

	const handleOpenEntry = () => {
		if (!entryId) return;
		navigate(`/journal/${encodeURIComponent(entryId)}/edit`);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/30 z-40"
						onClick={onClose}
					/>
					<motion.div
						initial={{ y: "100%", opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: "100%", opacity: 0 }}
						transition={{ type: "spring", damping: 28, stiffness: 300 }}
						className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] rounded-t-3xl z-50 max-h-[78vh] overflow-y-auto"
						style={{
							backgroundColor: "var(--color-surface-card)",
							border: "1px solid var(--color-border-soft)",
						}}
					>
						<div className="px-6 pt-3 pb-6">
							<div className="w-10 h-1.5 rounded-full mx-auto mb-4 bg-[var(--color-border-soft)]" />

							<div className="flex items-start justify-between mb-4 gap-3">
								<div className="flex-1">
									<p
										className="font-display text-[24px] font-semibold leading-tight"
										style={{ color: "var(--color-text-primary)" }}
									>
										{created}
									</p>
									{entryId ? (
										<button
											type="button"
											onClick={handleOpenEntry}
											className="text-xs mt-1 font-medium underline underline-offset-2"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{translateWithFallback(
												"journal.view_entry",
												"View full entry",
											)}
										</button>
									) : (
										<p
											className="text-xs mt-1"
											style={{ color: "var(--color-text-secondary)" }}
										>
											{translateWithFallback(
												"journal.view_entry",
												"Entry details",
											)}
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={onClose}
									aria-label={t("ui.close_modal")}
									className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
									style={{ backgroundColor: "var(--color-surface)" }}
								>
									<X size={18} className="text-[var(--color-text-muted)]" />
								</button>
							</div>

							{moods.length > 0 && (
								<div className="flex gap-1.5 flex-wrap mb-4">
									{moodTokens.map(({ mood, key }) => (
										<span
											key={key}
											className="text-xs px-2.5 py-1 rounded-full border"
											style={{
												backgroundColor:
													(MOOD_COLORS[mood] || "var(--color-secondary)") + "18",
												color: MOOD_COLORS[mood] || "var(--color-secondary)",
												borderColor: (MOOD_COLORS[mood] || "var(--color-secondary)") + "35",
											}}
										>
											{translateMoodLabel(mood)}
										</span>
									))}
								</div>
							)}

							<div className="grid grid-cols-2 gap-2 mb-4">
								{entry.session?.sessionType && (
									<div
										className="rounded-2xl p-3"
										style={{
											backgroundColor: "var(--color-surface)",
											border: "1px solid var(--color-border-soft)",
										}}
									>
										<p
											className="text-[10px] font-semibold uppercase tracking-wider mb-1"
											style={{ color: "var(--color-text-muted)" }}
										>
											{translateWithFallback(
												"journal.practice_type_label",
												"Practice Type",
											)}
										</p>
										<p
											className="text-sm"
											style={{ color: "var(--color-text-primary)" }}
										>
											{translateWithFallback(
												`journal.practice_types.${entry.session.sessionType}`,
												entry.session.sessionType,
											)}
										</p>
									</div>
								)}

								{entry.session?.duration && (
									<div
										className="rounded-2xl p-3"
										style={{
											backgroundColor: "var(--color-surface)",
											border: "1px solid var(--color-border-soft)",
										}}
									>
										<p
											className="text-[10px] font-semibold uppercase tracking-wider mb-1"
											style={{ color: "var(--color-text-muted)" }}
										>
											{translateWithFallback(
												"session.duration_label",
												"Duration",
											)}
										</p>
										<p
											className="text-sm"
											style={{ color: "var(--color-text-primary)" }}
										>
											{durationMinutes}{" "}
											{translateWithFallback("session_detail.minutes", "min")}
										</p>
									</div>
								)}
							</div>

							<div className="space-y-3">
								{entry.reflection && (
									<div>
										<p
											className="text-xs font-semibold uppercase tracking-wider mb-2"
											style={{ color: "var(--color-text-muted)" }}
										>
											{translateWithFallback(
												"journal.reflection_label",
												"Reflection",
											)}
										</p>
										<p
											className="text-sm leading-relaxed rounded-2xl p-4"
											style={{
												backgroundColor: "var(--color-surface)",
												border: "1px solid var(--color-border-soft)",
												color: "var(--color-text-secondary)",
											}}
										>
											{entry.reflection}
										</p>
									</div>
								)}

								{entry.insights && (
									<div>
										<p
											className="text-xs font-semibold uppercase tracking-wider mb-2"
											style={{ color: "var(--color-text-muted)" }}
										>
											{translateWithFallback(
												"journal_form.insights",
												"Insights",
											)}
										</p>
										<p
											className="text-sm leading-relaxed rounded-2xl p-4"
											style={{
												backgroundColor: "var(--color-surface)",
												border: "1px solid var(--color-border-soft)",
												color: "var(--color-text-secondary)",
											}}
										>
											{entry.insights}
										</p>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

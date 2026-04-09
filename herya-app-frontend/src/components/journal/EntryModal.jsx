import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "@/utils/helpers";
import { useLanguage } from "@/context/LanguageContext";
import {
	resolveEntryId,
	toMoodTokens,
	translateMoodLabel,
	translateWithFallback,
	getMoodColorStyle,
} from "@/utils/journalHelpers";

export const EntryModal = ({ entry, isOpen, onClose }) => {
	const { t, lang } = useLanguage();
	const navigate = useNavigate();
	const dialogRef = useRef(null);
	const previousFocusRef = useRef(null);

	// ── Escape key handler ───────────────────────────────────────────
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen, onClose]);

	// ── Focus management: trap focus + restore on close ──────────────
	useEffect(() => {
		if (isOpen) {
			previousFocusRef.current = document.activeElement;
			// Wait for animation to paint, then focus first focusable
			const timer = setTimeout(() => {
				const firstFocusable = dialogRef.current?.querySelector(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);
				firstFocusable?.focus();
			}, 50);
			return () => clearTimeout(timer);
		}
		// Restore focus when closing
		previousFocusRef.current?.focus();
	}, [isOpen]);

	const handleKeyDown = useCallback((e) => {
		if (e.key !== "Tab" || !dialogRef.current) return;
		const focusable = dialogRef.current.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}, []);

	// Compute derived data only when entry exists (but outside AnimatePresence
	// so exit animations still work with stale data)
	const entryId = entry ? resolveEntryId(entry) : null;
	const moods = entry ? (entry.moodAfter || entry.moodBefore || []) : [];
	const moodTokens = toMoodTokens(moods, `modal-${entryId || "none"}`);
	const created = entry ? format.date(entry.date || entry.createdAt, lang) : "";
	const durationMinutes = Math.max(
		1,
		Math.round(Number(entry?.session?.duration) || 0),
	);

	const handleOpenEntry = () => {
		if (!entryId) return;
		navigate(`/journal/${encodeURIComponent(entryId)}/edit`);
	};

	const titleId = "journal-entry-modal-title";

	return (
		<AnimatePresence>
			{isOpen && entry && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/30 z-40"
						onClick={onClose}
						aria-hidden="true"
					/>

					{/* Dialog */}
					<motion.div
						ref={dialogRef}
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						onKeyDown={handleKeyDown}
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
							{/* Drag handle */}
							<div className="w-10 h-1.5 rounded-full mx-auto mb-4 bg-[var(--color-border-soft)]" />

							{/* Header */}
							<div className="flex items-start justify-between mb-4 gap-3">
								<div className="flex-1">
									<p
										id={titleId}
										className="font-display text-lg font-semibold leading-tight"
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
												t,
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
												t,
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

							{/* Mood chips */}
							{moods.length > 0 && (
								<div className="flex gap-1.5 flex-wrap mb-4">
									{moodTokens.map(({ mood, key }) => (
										<span
											key={key}
											className="text-xs px-2.5 py-1 rounded-full border"
											style={getMoodColorStyle(mood)}
										>
											{translateMoodLabel(t, mood)}
										</span>
									))}
								</div>
							)}

							{/* Stats grid */}
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
												t,
												"journal.practice_type_label",
												"Practice Type",
											)}
										</p>
										<p
											className="text-sm"
											style={{ color: "var(--color-text-primary)" }}
										>
											{translateWithFallback(
												t,
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
												t,
												"session.duration_label",
												"Duration",
											)}
										</p>
										<p
											className="text-sm"
											style={{ color: "var(--color-text-primary)" }}
										>
											{durationMinutes}{" "}
											{translateWithFallback(t, "session_detail.minutes", "min")}
										</p>
									</div>
								)}
							</div>

							{/* Text sections */}
							<div className="space-y-3">
								{entry.reflection && (
									<div>
										<p
											className="text-xs font-semibold uppercase tracking-wider mb-2"
											style={{ color: "var(--color-text-muted)" }}
										>
											{translateWithFallback(
												t,
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
												t,
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

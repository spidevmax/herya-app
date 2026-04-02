import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getJournalEntries } from "@/api/journalEntries.api";
import FlowerGarden from "@/components/garden/FlowerGarden";
import { EmptyState } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "@/utils/helpers";
import { MOOD_COLORS } from "@/utils/constants";

export default function Garden() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState(null);

	useEffect(() => {
		getJournalEntries({ limit: 50 })
			.then((r) => {
				// Backend returns { journals, pagination }
				const payload = r.data?.data || r.data || {};
				const list =
					payload.journals ?? (Array.isArray(payload) ? payload : []);
				setEntries(list);
			})
			.catch(() => setEntries([]))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="flex flex-col gap-6 pt-4 pb-6">
			<div className="flex items-center justify-between px-4">
				<div>
					<h1
						className="font-display text-2xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-primary)",
						}}
					>
						{t("garden.title")}
					</h1>
					<p
						className="text-sm"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{entries.length}{" "}
						{entries.length !== 1
							? t("garden.entries_plural")
							: t("garden.entries_singular")}
					</p>
				</div>
				<button
					type="button"
					onClick={() => navigate("/session/journaling")}
					className="w-11 h-11 rounded-full bg-[#5DB075] flex items-center justify-center shadow-[0_4px_12px_rgba(93,176,117,0.4)]"
				>
					<Plus size={22} className="text-white" />
				</button>
			</div>

			{loading ? (
				<div className="mx-4 rounded-3xl h-72 bg-[#E8E4DE] animate-pulse" />
			) : entries.length === 0 ? (
				<EmptyState
					icon={<BookOpen size={36} />}
					title={t("garden.empty_title")}
					description={t("garden.empty_hint")}
					className="mx-4"
				/>
			) : (
				<div className="px-4">
					<FlowerGarden entries={entries} onFlowerClick={setSelected} />
					<p className="text-center text-[#9CA3AF] text-xs mt-3">
						{t("garden.tap_hint")}
					</p>
				</div>
			)}

			<AnimatePresence>
				{selected && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/30 z-40"
							onClick={() => setSelected(null)}
						/>
						<motion.div
							initial={{ y: "100%", opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: "100%", opacity: 0 }}
							transition={{ type: "spring", damping: 28, stiffness: 300 }}
							className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl p-6 z-50"
						>
							<div className="flex items-center justify-between mb-4">
								<div>
									<p className="font-display font-semibold text-[#1A1A2E]">
										{format.date(selected.date || selected.createdAt)}
									</p>
									<div className="flex gap-1 mt-1">
										{(selected.moodAfter || selected.moodBefore || []).map(
											(m) => (
												<span
													key={m}
													className="text-xs px-2 py-0.5 rounded-full"
													style={{
														backgroundColor:
															(MOOD_COLORS[m] || "#5DB075") + "20",
														color: MOOD_COLORS[m] || "#5DB075",
													}}
												>
													{m}
												</span>
											),
										)}
									</div>
								</div>
								<button
									type="button"
									onClick={() => setSelected(null)}
									className="w-9 h-9 rounded-full bg-[#F8F7F4] flex items-center justify-center"
								>
									<X size={18} className="text-[#6B7280]" />
								</button>
							</div>
							{selected.reflection && (
								<p className="text-[#6B7280] text-sm leading-relaxed bg-[#F8F7F4] rounded-2xl p-4">
									{selected.reflection}
								</p>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

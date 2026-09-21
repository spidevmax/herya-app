import { AnimatePresence, motion } from "framer-motion";
import {
	Check,
	ChevronDown,
	ChevronUp,
	Eye,
	PersonStanding,
	Search,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";
import { VK_FAMILY_BY_SLUG } from "@/utils/constants";
import { DIFF_ACCENTS, localized, localizedName } from "@/utils/libraryHelpers";
import SafetyBanner from "./SafetyBanner";

const formatFamily = (family, t) => {
	// The API sends a slug ("bow_sequence"); VK_FAMILY_MAP is keyed by numeric
	// id, so every lookup missed and the raw slug was shown instead.
	const entry = VK_FAMILY_BY_SLUG[family];
	if (entry?.labelKey && t) return t(entry.labelKey);
	return entry?.label || family?.replace(/[_-]/g, " ") || "";
};

const SequencePicker = ({ sequences = [], selectedId, onSelect }) => {
	const { t, lang } = useLanguage();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [previewId, setPreviewId] = useState(null);

	const filtered = useMemo(() => {
		if (!search.trim()) return sequences;
		const q = search.toLowerCase();
		return sequences.filter(
			(s) =>
				s.englishName?.toLowerCase().includes(q) ||
				s.spanishName?.toLowerCase().includes(q) ||
				s.sanskritName?.toLowerCase().includes(q) ||
				s.family?.toLowerCase().includes(q) ||
				s.difficulty?.toLowerCase().includes(q),
		);
	}, [sequences, search]);

	const selected = sequences.find((s) => s._id === selectedId);

	const handleSelect = (seq) => {
		onSelect(seq);
		setOpen(false);
		setSearch("");
	};

	return (
		<div className="flex flex-col gap-2">
			{/* Selected summary / open button */}
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="w-full rounded-xl border px-3 py-2.5 text-left flex items-center gap-2 transition"
				style={{
					backgroundColor: "var(--paper)",
					borderColor: selected ? "var(--chandra)" : "var(--ink)",
				}}
			>
				{selected ? (
					<div className="flex-1 min-w-0">
						<p
							className="text-sm font-semibold truncate"
							style={{ color: "var(--ink)" }}
						>
							{localizedName(selected, lang)}
						</p>
						<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
							{formatFamily(selected.family, t)} ·{" "}
							{t(`library.${selected.difficulty}`)} ·{" "}
							{selected.structure?.corePoses?.length || 0}{" "}
							{t("guided.poses_count")}
						</p>
					</div>
				) : (
					<span className="text-sm flex-1" style={{ color: "var(--ink-soft)" }}>
						{t("practice.select_sequence")}
					</span>
				)}
				{open ? (
					<ChevronUp size={16} style={{ color: "var(--ink-soft)" }} />
				) : (
					<ChevronDown size={16} style={{ color: "var(--ink-soft)" }} />
				)}
			</button>

			{/* Dropdown */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="rounded-xl border shadow-lg overflow-hidden"
						style={{
							backgroundColor: "var(--paper-raised)",
							borderColor: "var(--ink)",
						}}
					>
						{/* Search */}
						<label
							className="flex items-center gap-2 px-3 py-2 border-b"
							style={{ borderColor: "var(--ink)" }}
						>
							<Search
								size={14}
								aria-hidden="true"
								style={{ color: "var(--ink-soft)" }}
							/>
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={t("guided.search_sequences")}
								className="flex-1 text-sm bg-transparent outline-none"
								style={{ color: "var(--ink)" }}
							/>
							{search && (
								<button type="button" onClick={() => setSearch("")}>
									<X size={14} style={{ color: "var(--ink-soft)" }} />
								</button>
							)}
						</label>

						{/* List */}
						<div className="max-h-64 overflow-y-auto">
							{filtered.length === 0 ? (
								<p
									className="text-sm text-center py-6"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("library.no_results")}
								</p>
							) : (
								filtered.map((seq) => (
									<div
										key={seq._id}
										className="border-b last:border-b-0"
										style={{ borderColor: "var(--ink)" }}
									>
										{/*
										 * Two buttons side by side: one to pick the sequence, one
										 * to preview it.
										 *
										 * HTML does not allow a button inside another button, so the
										 * preview used to be a <span> pretending to be a button, with
										 * its own keyboard handling written by hand. Splitting them
										 * means both can be real buttons and the browser handles the
										 * keyboard for us.
										 */}
										<div className="flex w-full items-center gap-2 px-3 py-2.5">
											<button
												type="button"
												onClick={() => handleSelect(seq)}
												className="min-w-0 flex-1 text-left"
											>
												<p
													className="text-sm font-medium truncate"
													style={{
														color: "var(--ink)",
													}}
												>
													{localizedName(seq, lang)}
												</p>
												<div className="flex items-center gap-2 mt-0.5">
													<span
														className="px-1.5 py-0.5 text-[10px] font-bold"
														style={{
															// `${cssVar}15` is invalid CSS; the accent goes on the
															// outline instead of a fake translucent fill.
															border: `var(--ink-width) solid ${
																DIFF_ACCENTS[seq.difficulty] ?? "var(--ink)"
															}`,
															borderRadius: "var(--radius-block)",
															color:
																DIFF_ACCENTS[seq.difficulty] ?? "var(--ink)",
														}}
													>
														{t(`library.${seq.difficulty}`)}
													</span>
													<span
														className="text-[10px]"
														style={{
															color: "var(--ink-soft)",
														}}
													>
														{formatFamily(seq.family, t)}
													</span>
													<span
														className="text-[10px]"
														style={{
															color: "var(--ink-soft)",
														}}
													>
														{seq.structure?.corePoses?.length || 0}{" "}
														{t("guided.poses_count")}
													</span>
													{seq.estimatedDuration?.recommended && (
														<span
															className="text-[10px]"
															style={{
																color: "var(--ink-soft)",
															}}
														>
															~{seq.estimatedDuration.recommended}m
														</span>
													)}
												</div>
											</button>

											<button
												type="button"
												onClick={() =>
													setPreviewId(previewId === seq._id ? null : seq._id)
												}
												aria-expanded={previewId === seq._id}
												className="shrink-0 cursor-pointer p-1.5"
												style={{ color: "var(--ink-soft)" }}
												aria-label={t("guided.preview_sequence")}
											>
												<Eye size={14} />
											</button>

											{selectedId === seq._id && (
												<Check
													size={16}
													className="shrink-0"
													style={{
														color: "var(--chandra)",
													}}
												/>
											)}
										</div>

										{/* Preview panel */}
										<AnimatePresence>
											{previewId === seq._id && (
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: "auto", opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													className="overflow-hidden"
												>
													<SequencePreview sequence={seq} />
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								))
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Safety banner for selected sequence */}
			{selected?.therapeuticFocus?.contraindications?.length > 0 && (
				<SafetyBanner
					contraindications={selected.therapeuticFocus.contraindications}
				/>
			)}
		</div>
	);
};

const SequencePreview = ({ sequence }) => {
	const { t, lang } = useLanguage();
	const poses = sequence.structure?.corePoses || [];

	return (
		<div className="px-3 pb-3 border-t" style={{ borderColor: "var(--ink)" }}>
			{/* Therapeutic focus */}
			{(localized(sequence.therapeuticFocus, "primaryBenefit", lang) ||
				sequence.therapeuticFocus?.primaryBenefit) && (
				<p
					className="text-xs mt-2 mb-2 italic"
					style={{ color: "var(--ink-soft)" }}
				>
					{localized(sequence.therapeuticFocus, "primaryBenefit", lang)}
				</p>
			)}

			{/* Pose list */}
			{poses.length > 0 ? (
				<ol className="flex flex-col gap-1 list-none m-0 p-0">
					{poses.map((cp, i) => {
						const pose = cp.pose;
						if (!pose) return null;
						const name =
							localizedName(pose, lang) ||
							pose.romanizationName ||
							pose.name ||
							"—";
						return (
							<div key={cp._id || i} className="flex items-center gap-2 py-1">
								<span
									className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
									style={{
										backgroundColor: "var(--paper-raised)",
										color: "var(--chandra)",
									}}
								>
									{cp.order || i + 1}
								</span>
								{pose.media?.thumbnail?.url ? (
									<img
										src={pose.media.thumbnail.url}
										alt={name}
										className="w-8 h-8 rounded-lg object-cover shrink-0"
										loading="lazy"
									/>
								) : (
									<div
										className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
										style={{
											backgroundColor: "var(--paper-raised)",
										}}
									>
										<PersonStanding
											size={14}
											style={{ color: "var(--chandra)" }}
										/>
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p
										className="text-xs font-medium truncate"
										style={{ color: "var(--ink)" }}
									>
										{name}
									</p>
									{pose.sanskritName && (
										<p
											className="text-[10px] truncate"
											style={{
												color: "var(--ink-soft)",
											}}
										>
											{pose.sanskritName}
										</p>
									)}
								</div>
								<span
									className="text-[10px] shrink-0"
									style={{ color: "var(--ink-soft)" }}
								>
									{cp.breaths || 5}b
								</span>
							</div>
						);
					})}
				</ol>
			) : (
				<p
					className="text-xs text-center py-3"
					style={{ color: "var(--ink-soft)" }}
				>
					{t("guided.no_poses_data")}
				</p>
			)}
		</div>
	);
};

export default SequencePicker;

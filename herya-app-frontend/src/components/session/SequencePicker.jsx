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
import { VK_FAMILY_MAP } from "@/utils/constants";
import { localized, localizedName } from "@/utils/libraryHelpers";
import SafetyBanner from "./SafetyBanner";

const formatFamily = (family, t) => {
	const entry = VK_FAMILY_MAP[family];
	if (entry?.labelKey && t) return t(entry.labelKey);
	return entry?.label || family?.replace(/[_-]/g, " ") || "";
};

const difficultyColor = (d) => {
	switch (d) {
		case "beginner":
			return "var(--color-secondary)";
		case "intermediate":
			return "var(--color-primary)";
		case "advanced":
			return "var(--color-accent)";
		default:
			return "var(--color-text-muted)";
	}
};

export default function SequencePicker({
	sequences = [],
	selectedId,
	onSelect,
}) {
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
					backgroundColor: "var(--color-surface)",
					borderColor: selected
						? "var(--color-primary)"
						: "var(--color-border-soft)",
				}}
			>
				{selected ? (
					<div className="flex-1 min-w-0">
						<p
							className="text-sm font-semibold truncate"
							style={{ color: "var(--color-text-primary)" }}
						>
							{localizedName(selected, lang)}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{formatFamily(selected.family, t)} ·{" "}
							{t(`library.${selected.difficulty}`)} ·{" "}
							{selected.structure?.corePoses?.length || 0}{" "}
							{t("guided.poses_count")}
						</p>
					</div>
				) : (
					<span
						className="text-sm flex-1"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.select_sequence")}
					</span>
				)}
				{open ? (
					<ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} />
				) : (
					<ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />
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
							backgroundColor: "var(--color-surface-card)",
							borderColor: "var(--color-border-soft)",
						}}
					>
						{/* Search */}
						<label
							className="flex items-center gap-2 px-3 py-2 border-b"
							style={{ borderColor: "var(--color-border-soft)" }}
						>
							<Search
								size={14}
								aria-hidden="true"
								style={{ color: "var(--color-text-muted)" }}
							/>
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={t("guided.search_sequences")}
								className="flex-1 text-sm bg-transparent outline-none"
								style={{ color: "var(--color-text-primary)" }}
							/>
							{search && (
								<button type="button" onClick={() => setSearch("")}>
									<X size={14} style={{ color: "var(--color-text-muted)" }} />
								</button>
							)}
						</label>

						{/* List */}
						<div className="max-h-64 overflow-y-auto">
							{filtered.length === 0 ? (
								<p
									className="text-sm text-center py-6"
									style={{ color: "var(--color-text-muted)" }}
								>
									{t("library.no_results")}
								</p>
							) : (
								filtered.map((seq) => (
									<div
										key={seq._id}
										className="border-b last:border-b-0"
										style={{ borderColor: "var(--color-border-soft)" }}
									>
										<button
											type="button"
											onClick={() => handleSelect(seq)}
											className="w-full px-3 py-2.5 text-left flex items-center gap-2 hover:brightness-95 transition"
										>
											<div className="flex-1 min-w-0">
												<p
													className="text-sm font-medium truncate"
													style={{
														color: "var(--color-text-primary)",
													}}
												>
													{localizedName(seq, lang)}
												</p>
												<div className="flex items-center gap-2 mt-0.5">
													<span
														className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
														style={{
															backgroundColor: `${difficultyColor(seq.difficulty)}15`,
															color: difficultyColor(seq.difficulty),
														}}
													>
														{t(`library.${seq.difficulty}`)}
													</span>
													<span
														className="text-[10px]"
														style={{
															color: "var(--color-text-muted)",
														}}
													>
														{formatFamily(seq.family, t)}
													</span>
													<span
														className="text-[10px]"
														style={{
															color: "var(--color-text-muted)",
														}}
													>
														{seq.structure?.corePoses?.length || 0}{" "}
														{t("guided.poses_count")}
													</span>
													{seq.estimatedDuration?.recommended && (
														<span
															className="text-[10px]"
															style={{
																color: "var(--color-text-muted)",
															}}
														>
															~{seq.estimatedDuration.recommended}m
														</span>
													)}
												</div>
											</div>

											{/* Preview button (fix: not a button inside button) */}
											<span
												role="button"
												tabIndex={0}
												onClick={(e) => {
													e.stopPropagation();
													setPreviewId(previewId === seq._id ? null : seq._id);
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.stopPropagation();
														setPreviewId(
															previewId === seq._id ? null : seq._id,
														);
													}
												}}
												className="p-1.5 rounded-lg shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
												style={{
													color: "var(--color-text-muted)",
												}}
												aria-label={t("guided.preview_sequence")}
											>
												<Eye size={14} />
											</span>

											{selectedId === seq._id && (
												<Check
													size={16}
													className="shrink-0"
													style={{
														color: "var(--color-primary)",
													}}
												/>
											)}
										</button>

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
}

function SequencePreview({ sequence }) {
	const { t, lang } = useLanguage();
	const poses = sequence.structure?.corePoses || [];

	return (
		<div
			className="px-3 pb-3 border-t"
			style={{ borderColor: "var(--color-border-soft)" }}
		>
			{/* Therapeutic focus */}
			{(localized(sequence.therapeuticFocus, "primaryBenefit", lang) ||
				sequence.therapeuticFocus?.primaryBenefit) && (
				<p
					className="text-xs mt-2 mb-2 italic"
					style={{ color: "var(--color-text-secondary)" }}
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
										backgroundColor: "var(--color-primary-light, #EEF2FF)",
										color: "var(--color-primary)",
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
											backgroundColor: "var(--color-primary-light, #EEF2FF)",
										}}
									>
										<PersonStanding
											size={14}
											style={{ color: "var(--color-primary)" }}
										/>
									</div>
								)}
								<div className="flex-1 min-w-0">
									<p
										className="text-xs font-medium truncate"
										style={{ color: "var(--color-text-primary)" }}
									>
										{name}
									</p>
									{pose.sanskritName && (
										<p
											className="text-[10px] truncate"
											style={{
												color: "var(--color-text-muted)",
											}}
										>
											{pose.sanskritName}
										</p>
									)}
								</div>
								<span
									className="text-[10px] shrink-0"
									style={{ color: "var(--color-text-muted)" }}
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
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("guided.no_poses_data")}
				</p>
			)}
		</div>
	);
}

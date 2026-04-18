import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Search, Wind, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import SafetyBanner from "./SafetyBanner";

const formatHuman = (v) =>
	v
		? String(v)
				.replace(/[_-]+/g, " ")
				.replace(/\b\w/g, (c) => c.toUpperCase())
		: "";

const effectColor = (e) => {
	switch (e) {
		case "calming":
			return "var(--color-prana-balanced)";
		case "energizing":
			return "var(--color-prana-warm-accent)";
		case "balancing":
			return "var(--color-primary)";
		case "cooling":
			return "var(--color-prana-cooling)";
		case "heating":
			return "var(--color-prana-energizing)";
		default:
			return "var(--color-text-muted)";
	}
};

export default function BreathingPatternPicker({
	patterns = [],
	selectedId,
	onSelect,
}) {
	const { t } = useLanguage();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		if (!search.trim()) return patterns;
		const q = search.toLowerCase();
		return patterns.filter(
			(p) =>
				p.romanizationName?.toLowerCase().includes(q) ||
				p.sanskritName?.toLowerCase().includes(q) ||
				p.energyEffect?.toLowerCase().includes(q) ||
				p.difficulty?.toLowerCase().includes(q),
		);
	}, [patterns, search]);

	const selected = patterns.find((p) => p._id === selectedId);

	const handleSelect = (pat) => {
		onSelect(pat);
		setOpen(false);
		setSearch("");
	};

	const getRatioDisplay = (pat) => {
		if (!pat.patternRatio) return "";
		const { inhale, hold, exhale, holdAfterExhale } = pat.patternRatio;
		return `${inhale}:${hold}:${exhale}:${holdAfterExhale}`;
	};

	return (
		<div className="flex flex-col gap-2">
			{/* Selected / open button */}
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="w-full rounded-xl border px-3 py-2.5 text-left flex items-center gap-2 transition"
				style={{
					backgroundColor: "var(--color-surface)",
					borderColor: selected
						? "var(--color-secondary)"
						: "var(--color-border-soft)",
				}}
			>
				{selected ? (
					<div className="flex-1 min-w-0">
						<p
							className="text-sm font-semibold truncate"
							style={{ color: "var(--color-text-primary)" }}
						>
							{selected.romanizationName}
						</p>
						<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{getRatioDisplay(selected)} · {formatHuman(selected.energyEffect)}{" "}
							· {t(`library.${selected.difficulty}`)}
						</p>
					</div>
				) : (
					<span
						className="text-sm flex-1"
						style={{ color: "var(--color-text-muted)" }}
					>
						{t("practice.select_breathing")}
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
							<Search size={14} aria-hidden="true" style={{ color: "var(--color-text-muted)" }} />
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder={t("guided.search_patterns")}
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
								filtered.map((pat) => (
									<button
										key={pat._id}
										type="button"
										onClick={() => handleSelect(pat)}
										className="w-full px-3 py-2.5 text-left flex items-center gap-2 border-b last:border-b-0 hover:brightness-95 transition"
										style={{
											borderColor: "var(--color-border-soft)",
										}}
									>
										<div
											className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
											style={{
												backgroundColor: `${effectColor(pat.energyEffect)}15`,
											}}
										>
											<Wind
												size={14}
												style={{
													color: effectColor(pat.energyEffect),
												}}
											/>
										</div>
										<div className="flex-1 min-w-0">
											<p
												className="text-sm font-medium truncate"
												style={{
													color: "var(--color-text-primary)",
												}}
											>
												{pat.romanizationName}
											</p>
											<div className="flex items-center gap-2 mt-0.5">
												<span
													className="text-[10px] font-mono font-bold"
													style={{
														color: effectColor(pat.energyEffect),
													}}
												>
													{getRatioDisplay(pat)}
												</span>
												<span
													className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
													style={{
														backgroundColor: `${effectColor(pat.energyEffect)}15`,
														color: effectColor(pat.energyEffect),
													}}
												>
													{formatHuman(pat.energyEffect)}
												</span>
												<span
													className="text-[10px]"
													style={{
														color: "var(--color-text-muted)",
													}}
												>
													{t(`library.${pat.difficulty}`)}
												</span>
												{pat.recommendedPractice?.cycles?.default && (
													<span
														className="text-[10px]"
														style={{
															color: "var(--color-text-muted)",
														}}
													>
														~{pat.recommendedPractice.cycles.default}{" "}
														{t("guided.cycles")}
													</span>
												)}
											</div>
										</div>
										{selectedId === pat._id && (
											<Check
												size={16}
												className="shrink-0"
												style={{ color: "var(--color-secondary)" }}
											/>
										)}
									</button>
								))
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Safety banner */}
			{selected?.contraindications?.length > 0 && (
				<SafetyBanner
					contraindications={selected.contraindications}
					warnings={selected.warnings}
				/>
			)}
		</div>
	);
}

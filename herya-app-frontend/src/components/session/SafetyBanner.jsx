import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SafetyBanner({ contraindications = [], warnings = "" }) {
	const { t } = useLanguage();
	const [expanded, setExpanded] = useState(false);

	const items = contraindications.filter(Boolean);
	if (items.length === 0 && !warnings) return null;

	return (
		<motion.aside
			initial={{ opacity: 0, y: -4 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-xl p-3 border"
			style={{
				backgroundColor: "var(--color-warning-bg, #FEF3C7)",
				borderColor: "var(--color-warning-border, #F59E0B30)",
			}}
			role="alert"
		>
			<button
				type="button"
				onClick={() => setExpanded((e) => !e)}
				aria-expanded={expanded}
				aria-controls="safety-banner-details"
				className="flex items-center gap-2 w-full text-left"
			>
				<AlertTriangle
					size={16}
					aria-hidden="true"
					className="shrink-0"
					style={{ color: "var(--color-warning-text, #92400E)" }}
				/>
				<span
					className="text-xs font-semibold flex-1"
					style={{ color: "var(--color-warning-text, #92400E)" }}
				>
					{t("guided.safety_warning")} ({items.length})
				</span>
				{items.length > 0 && (
					<span aria-hidden="true" style={{ color: "var(--color-warning-text, #92400E)" }}>
						{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
					</span>
				)}
			</button>

			<AnimatePresence>
				{expanded && items.length > 0 && (
					<motion.ul
						id="safety-banner-details"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden mt-2 flex flex-col gap-1 list-none m-0 p-0"
					>
						{items.map((item) => (
							<li
								key={item}
								className="text-xs pl-6"
								style={{ color: "var(--color-warning-text, #92400E)" }}
							>
								<span aria-hidden="true">• </span>
								{item}
							</li>
						))}
						{warnings && (
							<li
								className="text-xs pl-6 font-medium mt-1"
								style={{ color: "var(--color-warning-text, #92400E)" }}
							>
								{warnings}
							</li>
						)}
					</motion.ul>
				)}
			</AnimatePresence>
		</motion.aside>
	);
}

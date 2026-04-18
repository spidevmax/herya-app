import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookmarkPlus, RotateCcw, Trash2, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import {
	getSessionTemplates,
	createSessionTemplate,
	useSessionTemplate,
	deleteSessionTemplate,
} from "@/api/sessionTemplates.api";

/**
 * SessionTemplatePicker — save/load session configurations.
 * "Last time, this worked" quick re-start.
 *
 * Props:
 * - sessionType: current session type
 * - blocks: current blocks (for saving)
 * - totalMinutes: current total
 * - preset: "adult" | "tutor"
 * - childProfileId: optional
 * - onLoadTemplate: callback when a template is loaded (receives blocks)
 * - visible: controls visibility
 */
export default function SessionTemplatePicker({
	sessionType,
	blocks = [],
	totalMinutes = 0,
	preset = "adult",
	childProfileId,
	onLoadTemplate,
	visible = true,
}) {
	const { t } = useLanguage();
	const [templates, setTemplates] = useState([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [showNameInput, setShowNameInput] = useState(false);
	const [templateName, setTemplateName] = useState("");

	useEffect(() => {
		if (!visible) return;
		setLoading(true);
		const params = {};
		if (childProfileId) params.childProfile = childProfileId;

		getSessionTemplates(params)
			.then((res) => {
				const data = res.data?.data || res.data || [];
				setTemplates(Array.isArray(data) ? data : []);
			})
			.catch(() => setTemplates([]))
			.finally(() => setLoading(false));
	}, [visible, childProfileId]);

	const handleSave = async () => {
		if (!templateName.trim() || blocks.length === 0) return;
		setSaving(true);
		try {
			const orderedBlocks = blocks.map((b, i) => ({
				blockType: b.blockType,
				label: b.label,
				durationMinutes: b.durationMinutes,
				order: i,
				vkSequence: b.vkSequence,
				breathingPattern: b.breathingPattern,
				meditationType: b.meditationType,
				guided: b.guided,
				level: b.level,
				config: b.config,
			}));

			const res = await createSessionTemplate({
				name: templateName.trim(),
				sessionType,
				blocks: orderedBlocks,
				totalMinutes,
				preset,
				childProfile: childProfileId || undefined,
			});

			const created = res.data?.data || res.data;
			setTemplates((prev) => [created, ...prev]);
			setShowNameInput(false);
			setTemplateName("");
		} catch {
			// silently fail
		} finally {
			setSaving(false);
		}
	};

	const handleLoad = async (template) => {
		try {
			await useSessionTemplate(template._id);
		} catch {
			// usage tracking is best-effort
		}
		onLoadTemplate?.(template.blocks, template.totalMinutes, template.sessionType);
	};

	const handleDelete = async (id) => {
		try {
			await deleteSessionTemplate(id);
			setTemplates((prev) => prev.filter((tpl) => tpl._id !== id));
		} catch {
			// silently fail
		}
	};

	if (!visible) return null;

	return (
		<section
			aria-label={t("practice.templates_title")}
			className="rounded-2xl p-4"
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<header className="flex items-center justify-between mb-3">
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("practice.templates_title")}
				</p>

				{blocks.length > 0 && (
					<button
						type="button"
						onClick={() => setShowNameInput(!showNameInput)}
						className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
						style={{
							backgroundColor: "var(--color-surface)",
							color: "var(--color-primary)",
						}}
						aria-label={t("practice.save_template")}
					>
						<BookmarkPlus size={14} />
						{t("practice.save_template")}
					</button>
				)}
			</header>

			{/* Save form */}
			<AnimatePresence>
				{showNameInput && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden mb-3"
					>
						<div className="flex gap-2">
							<input
								type="text"
								value={templateName}
								onChange={(e) => setTemplateName(e.target.value)}
								placeholder={t("practice.template_name_placeholder")}
								maxLength={80}
								className="flex-1 text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--color-surface)",
									color: "var(--color-text-primary)",
									"--tw-ring-color": "var(--color-secondary)",
								}}
							/>
							<Button
								onClick={handleSave}
								disabled={saving || !templateName.trim()}
								loading={saving}
								size="sm"
							>
								{t("ui.confirm")}
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Template list */}
			{loading ? (
				<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
					{t("ui.loading")}...
				</p>
			) : templates.length === 0 ? (
				<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
					{t("practice.templates_empty")}
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{templates.slice(0, 6).map((tpl) => (
						<div
							key={tpl._id}
							className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
							style={{
								backgroundColor: "var(--color-surface)",
								border: "1px solid var(--color-border-soft)",
							}}
						>
							<div className="min-w-0 flex-1">
								<p
									className="text-sm font-semibold truncate"
									style={{ color: "var(--color-text-primary)" }}
								>
									{tpl.name}
								</p>
								<p
									className="text-[10px]"
									style={{ color: "var(--color-text-muted)" }}
								>
									{tpl.blocks?.length || 0} blocks · {tpl.totalMinutes}m
									{tpl.usageCount > 0 &&
										` · ${t("practice.template_used", { n: tpl.usageCount })}`}
								</p>
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => handleLoad(tpl)}
									className="w-8 h-8 rounded-lg flex items-center justify-center"
									style={{
										backgroundColor: "var(--color-primary)",
										color: "white",
									}}
									aria-label={t("practice.load_template")}
								>
									<RotateCcw size={14} />
								</button>
								<button
									type="button"
									onClick={() => handleDelete(tpl._id)}
									className="w-8 h-8 rounded-lg flex items-center justify-center"
									style={{
										backgroundColor: "var(--color-surface-card)",
										color: "var(--color-text-muted)",
									}}
									aria-label={t("practice.delete_template")}
								>
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

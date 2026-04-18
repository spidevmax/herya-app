import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import {
	createBreathingPattern,
	deleteBreathingPattern,
	updateBreathingPattern,
} from "@/api/admin.api";
import { getBreathingPatterns } from "@/api/breathing.api";
import { Button, ConfirmModal, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const EFFECTS = ["calming", "energizing", "balancing", "cooling", "heating"];
const PATTERN_TYPES = ["ratio_based", "time_based", "count_based"];

const humanize = (value) =>
	String(value)
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeList = (payload) => {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.patterns)) return payload.patterns;
	if (Array.isArray(payload?.items)) return payload.items;
	return [];
};

const toForm = (item) => ({
	romanizationName: item?.romanizationName ?? "",
	iastName: item?.iastName ?? "",
	sanskritName: item?.sanskritName ?? "",
	description: item?.description ?? "",
	difficulty: item?.difficulty ?? "beginner",
	energyEffect: item?.energyEffect ?? "calming",
	patternType: item?.patternType ?? "ratio_based",
	inhale: String(item?.patternRatio?.inhale ?? 1),
	hold: String(item?.patternRatio?.hold ?? 0),
	exhale: String(item?.patternRatio?.exhale ?? 1),
	holdAfterExhale: String(item?.patternRatio?.holdAfterExhale ?? 0),
	baseBreathDuration: String(item?.baseBreathDuration ?? 5),
});

function BreathingPatternModal({ item, onClose, onSaved }) {
	const { t } = useLanguage();
	const isEditing = Boolean(item);
	const [form, setForm] = useState(() => toForm(item));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		setForm(toForm(item));
		setError("");
	}, [item]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError("");

		try {
			const payload = {
				romanizationName: form.romanizationName.trim(),
				iastName: form.iastName.trim(),
				sanskritName: form.sanskritName.trim(),
				description: form.description.trim(),
				difficulty: form.difficulty,
				energyEffect: form.energyEffect,
				patternType: form.patternType,
				baseBreathDuration: Number(form.baseBreathDuration || 5),
				patternRatio: {
					inhale: Number(form.inhale || 1),
					hold: Number(form.hold || 0),
					exhale: Number(form.exhale || 1),
					holdAfterExhale: Number(form.holdAfterExhale || 0),
				},
			};

			const response = isEditing
				? await updateBreathingPattern(item._id, payload)
				: await createBreathingPattern(payload);
			onSaved(response.data?.data || response.data);
		} catch (saveError) {
			setError(
				saveError.response?.data?.message ||
					t("admin.breathing_manager_save_error"),
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div role="dialog" aria-modal="true" aria-labelledby="breathing-modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
			<section
				aria-labelledby="breathing-modal-title"
				className="relative w-full max-w-2xl rounded-3xl p-5 shadow-[var(--shadow-card-hover)] sm:p-6"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label={t("admin.breathing_manager_cancel")}
					className="absolute right-4 top-4 rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
					<X size={18} aria-hidden="true" />
				</button>

				<h2 id="breathing-modal-title" className="pr-10 font-display text-2xl font-bold text-[var(--color-text-primary)]">
					{isEditing
						? t("admin.breathing_manager_edit")
						: t("admin.breathing_manager_create")}
				</h2>

				{error && (
					<p role="alert" className="mt-4 rounded-2xl border border-[var(--color-danger)] bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
						{error}
					</p>
				)}

				<form onSubmit={handleSubmit} className="mt-5 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_romanization")}
							</span>
							<input
								type="text"
								value={form.romanizationName}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										romanizationName: event.target.value,
									}))
								}
								required
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_iast")}
							</span>
							<input
								type="text"
								value={form.iastName}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, iastName: event.target.value }))
								}
								required
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_sanskrit")}
							</span>
							<input
								type="text"
								value={form.sanskritName}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										sanskritName: event.target.value,
									}))
								}
								required
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_base_duration")}
							</span>
							<input
								type="number"
								min="3"
								max="10"
								value={form.baseBreathDuration}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										baseBreathDuration: event.target.value,
									}))
								}
								required
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
					</div>

					<label className="space-y-1.5 text-sm">
						<span className="font-semibold text-[var(--color-text-primary)]">
							{t("admin.breathing_manager_description")}
						</span>
						<textarea
							value={form.description}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									description: event.target.value,
								}))
							}
							required
							rows={3}
							className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
						/>
					</label>

					<div className="grid gap-4 sm:grid-cols-3">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_difficulty")}
							</span>
							<select
								value={form.difficulty}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										difficulty: event.target.value,
									}))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							>
								{DIFFICULTIES.map((difficulty) => (
									<option key={difficulty} value={difficulty}>
										{humanize(difficulty)}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_energy_effect")}
							</span>
							<select
								value={form.energyEffect}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										energyEffect: event.target.value,
									}))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							>
								{EFFECTS.map((effect) => (
									<option key={effect} value={effect}>
										{humanize(effect)}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.breathing_manager_pattern_type")}
							</span>
							<select
								value={form.patternType}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										patternType: event.target.value,
									}))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							>
								{PATTERN_TYPES.map((type) => (
									<option key={type} value={type}>
										{humanize(type)}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className="grid gap-4 sm:grid-cols-4">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								Inhale
							</span>
							<input
								type="number"
								min="0"
								max="10"
								value={form.inhale}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, inhale: event.target.value }))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								Hold
							</span>
							<input
								type="number"
								min="0"
								max="10"
								value={form.hold}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, hold: event.target.value }))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								Exhale
							</span>
							<input
								type="number"
								min="0"
								max="10"
								value={form.exhale}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, exhale: event.target.value }))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								Hold After
							</span>
							<input
								type="number"
								min="0"
								max="10"
								value={form.holdAfterExhale}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										holdAfterExhale: event.target.value,
									}))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
					</div>

					<div className="flex gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={onClose}
						>
							{t("admin.breathing_manager_cancel")}
						</Button>
						<Button type="submit" loading={saving} className="flex-1">
							{isEditing
								? t("admin.breathing_manager_update")
								: t("admin.breathing_manager_create")}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}

export default function BreathingPatternManager() {
	const { t } = useLanguage();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [query, setQuery] = useState("");
	const [showModal, setShowModal] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		const loadItems = async () => {
			setLoading(true);
			setError(false);
			try {
				const response = await getBreathingPatterns({ limit: 100 });
				setItems(normalizeList(response.data?.data || response.data || []));
			} catch {
				setError(true);
				setItems([]);
			} finally {
				setLoading(false);
			}
		};

		loadItems();
	}, []);

	const filteredItems = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return items;
		return items.filter((item) =>
			[item.romanizationName, item.iastName, item.sanskritName]
				.filter(Boolean)
				.some((field) => field.toLowerCase().includes(normalized)),
		);
	}, [items, query]);

	const handleSaved = (saved) => {
		setItems((previous) => {
			const exists = previous.some((item) => item._id === saved._id);
			if (!exists) return [saved, ...previous];
			return previous.map((item) => (item._id === saved._id ? saved : item));
		});
		setShowModal(false);
		setEditingItem(null);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await deleteBreathingPattern(deleteTarget._id);
			setItems((previous) =>
				previous.filter((item) => item._id !== deleteTarget._id),
			);
			setDeleteTarget(null);
		} catch {
			setError(true);
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<section aria-label={t("admin.tab_breathing") || "Breathing patterns"} className="flex flex-col gap-4">
			<search className="flex flex-col gap-3 rounded-3xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search
						size={16}
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
					/>
					<label htmlFor="breathing-manager-search" className="sr-only">
						{t("admin.breathing_manager_search")}
					</label>
					<input
						id="breathing-manager-search"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={t("admin.breathing_manager_search")}
						className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
					/>
				</div>
				<Button onClick={() => setShowModal(true)} className="shrink-0">
					<Plus size={16} aria-hidden="true" />
					{t("admin.breathing_manager_create")}
				</Button>
			</search>

			{error && (
				<p role="alert" className="flex items-center gap-2 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
					<AlertTriangle size={16} aria-hidden="true" />
					<span>{t("admin.breathing_manager_load_error")}</span>
				</p>
			)}

			{loading ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
					{["b1", "b2", "b3", "b4", "b5", "b6"].map((key) => (
						<SkeletonCard key={key} />
					))}
				</div>
			) : filteredItems.length > 0 ? (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 list-none m-0 p-0">
					{filteredItems.map((item) => (
						<li key={item._id}>
							<article
								aria-labelledby={`breathing-card-${item._id}-title`}
								className="rounded-3xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)]"
							>
								<h3 id={`breathing-card-${item._id}-title`} className="text-base font-semibold text-[var(--color-text-primary)]">
									{item.romanizationName}
								</h3>
								<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
									{item.iastName}
								</p>
								<ul className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)] list-none m-0 p-0">
									<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
										{humanize(item.difficulty || "beginner")}
									</li>
									<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
										{humanize(item.energyEffect || "calming")}
									</li>
									<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
										{item.patternRatio?.inhale ?? 1}:
										{item.patternRatio?.hold ?? 0}:
										{item.patternRatio?.exhale ?? 1}:
										{item.patternRatio?.holdAfterExhale ?? 0}
									</li>
								</ul>
								<p className="mt-3 line-clamp-2 text-xs text-[var(--color-text-muted)]">
									{item.description}
								</p>
								<div className="mt-4 flex gap-2">
									<Button
										variant="outline"
										size="sm"
										className="flex-1"
										onClick={() => {
											setEditingItem(item);
											setShowModal(true);
										}}
									>
										<Edit2 size={14} aria-hidden="true" />
										{t("admin.breathing_manager_edit")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="flex-1 text-[var(--color-danger)]"
										onClick={() => setDeleteTarget(item)}
									>
										<Trash2 size={14} aria-hidden="true" />
										{t("admin.breathing_manager_delete")}
									</Button>
								</div>
							</article>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-3xl bg-[var(--color-surface-card)] p-8 text-center text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-card)] m-0">
					{t("admin.breathing_manager_empty")}
				</p>
			)}

			<ConfirmModal
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				title={t("admin.breathing_manager_delete_title", {
					name: deleteTarget?.romanizationName ?? "",
				})}
				description={t("admin.breathing_manager_delete_desc")}
				confirmLabel={t("admin.breathing_manager_delete")}
				danger
				loading={deleteLoading}
			/>

			{showModal && (
				<BreathingPatternModal
					item={editingItem}
					onClose={() => {
						setShowModal(false);
						setEditingItem(null);
					}}
					onSaved={handleSaved}
				/>
			)}
		</section>
	);
}

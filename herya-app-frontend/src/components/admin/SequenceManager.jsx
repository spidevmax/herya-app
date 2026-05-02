import { AlertTriangle, Edit2, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	createSequence,
	deleteSequence,
	updateSequence,
} from "@/api/admin.api";
import { getSequences } from "@/api/sequences.api";
import { Button, ConfirmModal, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const FAMILIES = [
	"tadasana",
	"standing_asymmetric",
	"standing_symmetric",
	"one_leg_standing",
	"seated",
	"supine",
	"prone",
	"inverted",
	"meditative",
	"bow_sequence",
	"triangle_sequence",
	"sun_salutation",
	"vajrasana_variations",
	"lotus_variations",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const LEVELS = [1, 2, 3];

const humanize = (value) =>
	String(value)
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeSequenceList = (payload) => {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.sequences)) return payload.sequences;
	if (Array.isArray(payload?.items)) return payload.items;
	return [];
};

const toForm = (sequence) => ({
	englishName: sequence?.englishName ?? "",
	sanskritName: sequence?.sanskritName ?? "",
	family: sequence?.family ?? FAMILIES[0],
	level: String(sequence?.level ?? 1),
	difficulty: sequence?.difficulty ?? "beginner",
	primaryBenefit: sequence?.therapeuticFocus?.primaryBenefit ?? "",
});

function SequenceModal({ sequence, onClose, onSaved }) {
	const { t } = useLanguage();
	const isEditing = Boolean(sequence);
	const [form, setForm] = useState(() => toForm(sequence));
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		setForm(toForm(sequence));
		setError("");
	}, [sequence]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError("");

		try {
			const payload = {
				englishName: form.englishName.trim(),
				sanskritName: form.sanskritName.trim(),
				family: form.family,
				level: Number(form.level),
				difficulty: form.difficulty,
				therapeuticFocus: {
					primaryBenefit: form.primaryBenefit.trim(),
				},
			};

			const response = isEditing
				? await updateSequence(sequence._id, payload)
				: await createSequence(payload);
			onSaved(response.data?.data || response.data);
		} catch (saveError) {
			setError(
				saveError.response?.data?.message ||
					t("admin.sequence_manager_save_error"),
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="sequence-modal-title"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
		>
			<section
				aria-labelledby="sequence-modal-title"
				className="relative w-full max-w-2xl rounded-3xl p-5 shadow-[var(--shadow-card-hover)] sm:p-6"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label={t("admin.sequence_manager_cancel")}
					className="absolute right-4 top-4 rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
					<X size={18} aria-hidden="true" />
				</button>

				<h2
					id="sequence-modal-title"
					className="pr-10 font-display text-2xl font-bold text-[var(--color-text-primary)]"
				>
					{isEditing
						? t("admin.sequence_manager_edit")
						: t("admin.sequence_manager_create")}
				</h2>

				{error && (
					<p
						role="alert"
						className="mt-4 rounded-2xl border border-[var(--color-danger)] bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-danger)]"
					>
						{error}
					</p>
				)}

				<form onSubmit={handleSubmit} className="mt-5 space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.sequence_manager_english_name")}
							</span>
							<input
								type="text"
								value={form.englishName}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										englishName: event.target.value,
									}))
								}
								required
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							/>
						</label>
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.sequence_manager_sanskrit_name")}
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
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.sequence_manager_family")}
							</span>
							<select
								value={form.family}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, family: event.target.value }))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							>
								{FAMILIES.map((family) => (
									<option key={family} value={family}>
										{humanize(family)}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.sequence_manager_level")}
							</span>
							<select
								value={form.level}
								onChange={(event) =>
									setForm((prev) => ({ ...prev, level: event.target.value }))
								}
								className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
							>
								{LEVELS.map((level) => (
									<option key={level} value={String(level)}>
										{level}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5 text-sm">
							<span className="font-semibold text-[var(--color-text-primary)]">
								{t("admin.sequence_manager_difficulty")}
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
					</div>

					<label className="space-y-1.5 text-sm">
						<span className="font-semibold text-[var(--color-text-primary)]">
							{t("admin.sequence_manager_primary_benefit")}
						</span>
						<textarea
							value={form.primaryBenefit}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									primaryBenefit: event.target.value,
								}))
							}
							required
							rows={3}
							className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
						/>
					</label>

					<div className="flex gap-2 pt-1">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={onClose}
						>
							{t("admin.sequence_manager_cancel")}
						</Button>
						<Button type="submit" loading={saving} className="flex-1">
							{isEditing
								? t("admin.sequence_manager_update")
								: t("admin.sequence_manager_create")}
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
}

export default function SequenceManager() {
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
				const response = await getSequences({ limit: 100 });
				setItems(
					normalizeSequenceList(response.data?.data || response.data || []),
				);
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
			[item.englishName, item.sanskritName, item.family]
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
			await deleteSequence(deleteTarget._id);
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
		<section
			aria-label={t("admin.tab_sequences") || "Sequences"}
			className="flex flex-col gap-4"
		>
			<search className="flex flex-col gap-3 rounded-3xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search
						size={16}
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
					/>
					<label htmlFor="sequence-manager-search" className="sr-only">
						{t("admin.sequence_manager_search")}
					</label>
					<input
						id="sequence-manager-search"
						type="search"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={t("admin.sequence_manager_search")}
						className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
					/>
				</div>
				<Button onClick={() => setShowModal(true)} className="shrink-0">
					<Plus size={16} aria-hidden="true" />
					{t("admin.sequence_manager_create")}
				</Button>
			</search>

			{error && (
				<p
					role="alert"
					className="flex items-center gap-2 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]"
				>
					<AlertTriangle size={16} aria-hidden="true" />
					<span>{t("admin.sequence_manager_load_error")}</span>
				</p>
			)}

			{loading ? (
				<div
					className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
					aria-busy="true"
				>
					{["s1", "s2", "s3", "s4", "s5", "s6"].map((key) => (
						<SkeletonCard key={key} />
					))}
				</div>
			) : filteredItems.length > 0 ? (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 list-none m-0 p-0">
					{filteredItems.map((item) => (
						<li key={item._id}>
							<article
								aria-labelledby={`sequence-card-${item._id}-title`}
								className="flex h-full flex-col rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
							>
								<header className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<h3
											id={`sequence-card-${item._id}-title`}
											className="truncate text-base font-semibold text-[var(--color-text-primary)]"
										>
											{item.englishName}
										</h3>
										<p className="truncate text-sm text-[var(--color-text-secondary)]">
											{item.sanskritName}
										</p>
									</div>
									<span
										className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
										style={{
											backgroundColor:
												"color-mix(in srgb, var(--color-primary) 12%, transparent)",
											color: "var(--color-primary)",
										}}
									>
										L{item.level}
									</span>
								</header>

								<ul className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)] list-none m-0 p-0">
									<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
										{humanize(item.family)}
									</li>
									<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
										{humanize(item.difficulty || "beginner")}
									</li>
								</ul>

								<p className="mt-3 text-xs text-[var(--color-text-muted)] line-clamp-2">
									{item.therapeuticFocus?.primaryBenefit || "—"}
								</p>

								<div
									className="mt-4 flex items-center justify-between gap-2 border-t pt-3"
									style={{ borderColor: "var(--color-border-soft)" }}
								>
									<Button
										variant="outline"
										size="sm"
										className="inline-flex items-center gap-1.5 whitespace-nowrap"
										onClick={() => {
											setEditingItem(item);
											setShowModal(true);
										}}
									>
										<Edit2 size={14} aria-hidden="true" />
										{t("admin.sequence_manager_edit")}
									</Button>
									<button
										type="button"
										onClick={() => setDeleteTarget(item)}
										className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)] focus-visible:ring-offset-1"
										style={{ color: "var(--color-danger)" }}
									>
										<Trash2 size={14} aria-hidden="true" />
										{t("admin.sequence_manager_delete")}
									</button>
								</div>
							</article>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-3xl bg-[var(--color-surface-card)] p-8 text-center text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-card)] m-0">
					{t("admin.sequence_manager_empty")}
				</p>
			)}

			<ConfirmModal
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				title={t("admin.sequence_manager_delete_title", {
					name: deleteTarget?.englishName ?? "",
				})}
				description={t("admin.sequence_manager_delete_desc")}
				confirmLabel={t("admin.sequence_manager_delete")}
				danger
				loading={deleteLoading}
			/>

			{showModal && (
				<SequenceModal
					sequence={editingItem}
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

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
	AlertTriangle,
	Edit2,
	Plus,
	Search,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { createPose, deletePose, updatePose } from "@/api/admin.api";
import { getPoses } from "@/api/poses.api";
import { Badge, Button, ConfirmModal, SkeletonCard } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const PRIMARY_CATEGORIES = [
	"standing_mountain",
	"standing_asymmetric",
	"standing_symmetric",
	"one_leg_balance",
	"seated_forward",
	"seated_twist",
	"seated_hip_opener",
	"supine",
	"prone",
	"inverted",
	"arm_support",
	"backbend",
	"meditative",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const DRISHTIS = [
	"none",
	"nasagrai",
	"brumadhya",
	"nabi_chakra",
	"hastagrai",
	"padayoragrai",
	"parshva_drishti",
	"angushta_madhyai",
	"urdhva_drishti",
];
const SIDEDNESS = ["symmetric", "left_only", "right_only", "both_sides"];

const humanizeValue = (value) =>
	String(value)
		.replace(/_/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());

const toFormState = (pose) => ({
	name: pose?.name ?? "",
	romanizationName: pose?.romanizationName ?? "",
	iastName: pose?.iastName ?? "",
	sanskritName: pose?.sanskritName ?? "",
	primaryCategory: pose?.vkCategory?.primary ?? PRIMARY_CATEGORIES[0],
	difficulty: pose?.difficulty ?? "beginner",
	drishti: pose?.drishti ?? "none",
	sidednessType: pose?.sidedness?.type ?? "symmetric",
	sidednessBreathsPerSide: String(pose?.sidedness?.breathsPerSide ?? 5),
});

const normalizePoseList = (payload) => {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.poses)) return payload.poses;
	if (Array.isArray(payload?.items)) return payload.items;
	return [];
};

function PoseFormModal({ pose, onClose, onSaved }) {
	const { t } = useLanguage();
	const isEditing = Boolean(pose);
	const [form, setForm] = useState(() => toFormState(pose));
	const [thumbnailFile, setThumbnailFile] = useState(null);
	const [imageFiles, setImageFiles] = useState([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		setForm(toFormState(pose));
		setThumbnailFile(null);
		setImageFiles([]);
		setError("");
	}, [pose]);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSaving(true);
		setError("");

		try {
			const payload = new FormData();
			payload.append("name", form.name.trim());
			payload.append("romanizationName", form.romanizationName.trim());
			payload.append("iastName", form.iastName.trim());
			payload.append("sanskritName", form.sanskritName.trim());
			payload.append("vkCategory.primary", form.primaryCategory);
			payload.append("difficulty", form.difficulty);
			payload.append("drishti", form.drishti);
			payload.append("sidedness.type", form.sidednessType);
			payload.append(
				"sidedness.breathsPerSide",
				String(form.sidednessBreathsPerSide || 5),
			);

			if (thumbnailFile) {
				payload.append("thumbnail", thumbnailFile);
			}

			imageFiles.forEach((file) => {
				payload.append("images", file);
			});

			const response = isEditing
				? await updatePose(pose._id, payload)
				: await createPose(payload);
			const savedPose = response.data?.data || response.data;
			onSaved(savedPose);
		} catch (saveError) {
			setError(
				saveError.response?.data?.message || t("admin.pose_manager_save_error"),
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="pose-form-title"
			aria-describedby="pose-form-subtitle"
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
		>
			<motion.section
				initial={{ opacity: 0, y: 14, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 10, scale: 0.98 }}
				className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-[var(--shadow-card-hover)]"
				style={{ backgroundColor: "var(--color-surface-card)" }}
			>
				<button
					type="button"
					onClick={onClose}
					aria-label={t("admin.pose_manager_cancel")}
					className="absolute right-4 top-4 rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
				>
					<X size={18} aria-hidden="true" />
				</button>

				<header className="pr-10">
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
						{t("admin.tab_poses")}
					</p>
					<h2 id="pose-form-title" className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)]">
						{isEditing
							? t("admin.pose_manager_edit")
							: t("admin.pose_manager_create")}
					</h2>
					<p id="pose-form-subtitle" className="mt-2 text-sm text-[var(--color-text-secondary)]">
						{t("admin.pose_manager_subtitle")}
					</p>
				</header>

				{error && (
					<p
						role="alert"
						className="mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
						style={{
							backgroundColor: "var(--color-error-bg)",
							borderColor: "var(--color-danger)",
							color: "var(--color-danger)",
						}}
					>
						<AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
						<span>{error}</span>
					</p>
				)}

				<form className="mt-5 space-y-5" onSubmit={handleSubmit}>
					<div className="grid gap-4 md:grid-cols-2">
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_name")}
							</span>
							<input
								type="text"
								value={form.name}
								onChange={(event) => updateField("name", event.target.value)}
								required
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							/>
						</label>
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_romanization")}
							</span>
							<input
								type="text"
								value={form.romanizationName}
								onChange={(event) =>
									updateField("romanizationName", event.target.value)
								}
								required
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							/>
						</label>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_iast")}
							</span>
							<input
								type="text"
								value={form.iastName}
								onChange={(event) =>
									updateField("iastName", event.target.value)
								}
								required
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							/>
						</label>
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_sanskrit")}
							</span>
							<input
								type="text"
								value={form.sanskritName}
								onChange={(event) =>
									updateField("sanskritName", event.target.value)
								}
								required
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							/>
						</label>
					</div>

					<div className="grid gap-4 md:grid-cols-4">
						<label className="space-y-2 text-sm md:col-span-2">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_primary_category")}
							</span>
							<select
								value={form.primaryCategory}
								onChange={(event) =>
									updateField("primaryCategory", event.target.value)
								}
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							>
								{PRIMARY_CATEGORIES.map((category) => (
									<option key={category} value={category}>
										{humanizeValue(category)}
									</option>
								))}
							</select>
						</label>
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_difficulty")}
							</span>
							<select
								value={form.difficulty}
								onChange={(event) =>
									updateField("difficulty", event.target.value)
								}
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							>
								{DIFFICULTIES.map((difficulty) => (
									<option key={difficulty} value={difficulty}>
										{humanizeValue(difficulty)}
									</option>
								))}
							</select>
						</label>
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_drishti")}
							</span>
							<select
								value={form.drishti}
								onChange={(event) => updateField("drishti", event.target.value)}
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							>
								{DRISHTIS.map((drishti) => (
									<option key={drishti} value={drishti}>
										{humanizeValue(drishti)}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_sidedness")}
							</span>
							<select
								value={form.sidednessType}
								onChange={(event) =>
									updateField("sidednessType", event.target.value)
								}
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							>
								{SIDEDNESS.map((option) => (
									<option key={option} value={option}>
										{humanizeValue(option)}
									</option>
								))}
							</select>
						</label>
						<label className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_breaths_per_side")}
							</span>
							<input
								type="number"
								min="3"
								max="12"
								value={form.sidednessBreathsPerSide}
								onChange={(event) =>
									updateField("sidednessBreathsPerSide", event.target.value)
								}
								className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
								style={{
									backgroundColor: "var(--color-surface)",
									borderColor: "var(--color-border-soft)",
									color: "var(--color-text-primary)",
								}}
							/>
						</label>
						<div className="space-y-2 text-sm">
							<span className="block font-semibold text-[var(--color-text-primary)]">
								{t("admin.pose_manager_thumbnail")}
							</span>
							<label
								className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors hover:border-[var(--color-primary)]"
								style={{
									borderColor: "var(--color-border-soft)",
									backgroundColor: "var(--color-surface)",
								}}
							>
								<Upload size={18} className="text-[var(--color-primary)]" />
								<span className="text-xs text-[var(--color-text-secondary)]">
									{thumbnailFile
										? thumbnailFile.name
										: isEditing && pose?.media?.thumbnail?.url
											? t("admin.pose_manager_current_thumbnail")
											: t("admin.pose_manager_upload_thumbnail")}
								</span>
								<input
									type="file"
									accept="image/*"
									onChange={(event) =>
										setThumbnailFile(event.target.files?.[0] ?? null)
									}
									className="hidden"
								/>
							</label>
						</div>
					</div>

					<div className="space-y-2 text-sm">
						<span className="block font-semibold text-[var(--color-text-primary)]">
							{t("admin.pose_manager_images")}
						</span>
						<label
							className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors hover:border-[var(--color-primary)]"
							style={{
								borderColor: "var(--color-border-soft)",
								backgroundColor: "var(--color-surface)",
							}}
						>
							<Upload size={18} className="text-[var(--color-primary)]" />
							<span className="text-xs text-[var(--color-text-secondary)]">
								{imageFiles.length > 0
									? `${imageFiles.length} ${t("admin.pose_manager_images")}`
									: t("admin.pose_manager_upload_images")}
							</span>
							<input
								type="file"
								accept="image/*"
								multiple
								onChange={(event) =>
									setImageFiles(Array.from(event.target.files || []))
								}
								className="hidden"
							/>
						</label>
						{isEditing && pose?.media?.images?.length > 0 && (
							<div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{pose.media.images.slice(0, 6).map((image, index) => (
									<div
										key={image.cloudinaryId ?? image.url ?? index}
										className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)]"
									>
										<img
											src={image.url}
											alt={pose.name}
											className="h-24 w-full object-cover"
										/>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-col gap-3 pt-2 sm:flex-row">
						<Button
							variant="outline"
							type="button"
							onClick={onClose}
							className="sm:flex-1"
						>
							{t("admin.pose_manager_cancel")}
						</Button>
						<Button type="submit" loading={saving} className="sm:flex-1">
							{isEditing
								? t("admin.pose_manager_update")
								: t("admin.pose_manager_create")}
						</Button>
					</div>
				</form>
			</motion.section>
		</motion.div>
	);
}

export default function PoseManager() {
	const { t } = useLanguage();
	const [poses, setPoses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [actionError, setActionError] = useState("");
	const [search, setSearch] = useState("");
	const [difficulty, setDifficulty] = useState("all");
	const [showForm, setShowForm] = useState(false);
	const [editingPose, setEditingPose] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		const loadPoses = async () => {
			setLoading(true);
			setError(false);
			try {
				const response = await getPoses({ limit: 100 });
				const list = normalizePoseList(
					response.data?.data || response.data || [],
				);
				setPoses(list);
			} catch {
				setError(true);
				setPoses([]);
			} finally {
				setLoading(false);
			}
		};

		loadPoses();
	}, []);

	const filteredPoses = useMemo(() => {
		const query = search.trim().toLowerCase();
		return poses.filter((pose) => {
			const matchesDifficulty =
				difficulty === "all" || pose.difficulty === difficulty;
			const matchesQuery =
				!query ||
				[pose.name, pose.romanizationName, pose.iastName, pose.sanskritName]
					.filter(Boolean)
					.some((field) => field.toLowerCase().includes(query));

			return matchesDifficulty && matchesQuery;
		});
	}, [poses, search, difficulty]);

	const handleSavedPose = (savedPose) => {
		setPoses((previous) => {
			const exists = previous.some((pose) => pose._id === savedPose._id);
			if (!exists) return [savedPose, ...previous];
			return previous.map((pose) =>
				pose._id === savedPose._id ? savedPose : pose,
			);
		});
		setShowForm(false);
		setEditingPose(null);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		setActionError("");
		try {
			await deletePose(deleteTarget._id);
			setPoses((previous) =>
				previous.filter((pose) => pose._id !== deleteTarget._id),
			);
			setDeleteTarget(null);
		} catch (err) {
			setActionError(
				err?.response?.data?.message || t("admin.pose_manager_delete_error"),
			);
			setDeleteTarget(null);
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<section aria-label={t("admin.tab_poses")} className="flex flex-col gap-4">
			<search className="flex flex-col gap-3 rounded-3xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search
						size={16}
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
					/>
					<label htmlFor="pose-manager-search" className="sr-only">
						{t("admin.pose_manager_search")}
					</label>
					<input
						id="pose-manager-search"
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={t("admin.pose_manager_search")}
						className="w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] py-3 pl-10 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
					/>
				</div>

				<label htmlFor="pose-manager-difficulty" className="sr-only">
					{t("admin.pose_manager_difficulty")}
				</label>
				<select
					id="pose-manager-difficulty"
					value={difficulty}
					onChange={(event) => setDifficulty(event.target.value)}
					className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)]"
				>
					<option value="all">{t("admin.pose_manager_filter_all")}</option>
					<option value="beginner">
						{t("admin.pose_manager_filter_beginner")}
					</option>
					<option value="intermediate">
						{t("admin.pose_manager_filter_intermediate")}
					</option>
					<option value="advanced">
						{t("admin.pose_manager_filter_advanced")}
					</option>
				</select>

				<Button onClick={() => setShowForm(true)} className="shrink-0">
					<Plus size={16} aria-hidden="true" />
					{t("admin.pose_manager_create")}
				</Button>
			</search>

			{error && (
				<p role="alert" className="flex items-center gap-2 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
					<AlertTriangle size={16} aria-hidden="true" />
					<span>{t("admin.pose_manager_load_error")}</span>
				</p>
			)}

			{actionError && (
				<p role="alert" className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
					<AlertTriangle size={16} aria-hidden="true" />
					<span>{actionError}</span>
				</p>
			)}

			{loading ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
					{["p1", "p2", "p3", "p4", "p5", "p6"].map((key) => (
						<SkeletonCard key={key} />
					))}
				</div>
			) : filteredPoses.length > 0 ? (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 list-none m-0 p-0">
					{filteredPoses.map((pose) => (
						<li key={pose._id}>
							<article
								aria-labelledby={`pose-card-${pose._id}-name`}
								className="overflow-hidden rounded-3xl bg-[var(--color-surface-card)] shadow-[var(--shadow-card)]"
							>
								{pose.media?.thumbnail?.url ? (
									<img
										src={pose.media.thumbnail.url}
										alt={pose.name}
										className="h-44 w-full object-cover"
									/>
								) : (
									<p className="flex h-44 items-center justify-center bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] m-0">
										{t("admin.pose_manager_no_thumbnail")}
									</p>
								)}
								<div className="space-y-3 p-4">
									<header className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<h3 id={`pose-card-${pose._id}-name`} className="truncate text-base font-semibold text-[var(--color-text-primary)]">
												{pose.name}
											</h3>
											<p className="truncate text-sm text-[var(--color-text-secondary)]">
												{pose.romanizationName}
											</p>
										</div>
										<Badge color="var(--color-primary)">{pose.difficulty}</Badge>
									</header>

									<ul className="flex flex-wrap gap-2 text-xs text-[var(--color-text-secondary)] list-none m-0 p-0">
										<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
											{humanizeValue(pose.vkCategory?.primary ?? "")}
										</li>
										<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
											{humanizeValue(pose.sidedness?.type ?? "symmetric")}
										</li>
										<li className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">
											{humanizeValue(pose.drishti ?? "none")}
										</li>
									</ul>

									{pose.media?.images?.length > 0 && (
										<p className="text-xs text-[var(--color-text-muted)]">
											{pose.media.images.length} {t("admin.pose_manager_images")}
										</p>
									)}

									<div className="flex gap-2 pt-1">
										<Button
											variant="outline"
											size="sm"
											className="flex-1"
											onClick={() => {
												setEditingPose(pose);
												setShowForm(true);
											}}
										>
											<Edit2 size={14} aria-hidden="true" />
											{t("admin.pose_manager_edit")}
										</Button>
										<Button
											variant="ghost"
											size="sm"
											className="flex-1 text-[var(--color-danger)]"
											onClick={() => setDeleteTarget(pose)}
										>
											<Trash2 size={14} aria-hidden="true" />
											{t("admin.pose_manager_delete")}
										</Button>
									</div>
								</div>
							</article>
						</li>
					))}
				</ul>
			) : (
				<p className="rounded-3xl bg-[var(--color-surface-card)] p-8 text-center text-sm text-[var(--color-text-muted)] shadow-[var(--shadow-card)] m-0">
					{t("admin.pose_manager_empty")}
				</p>
			)}

			<ConfirmModal
				open={Boolean(deleteTarget)}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleDelete}
				title={t("admin.pose_manager_delete_title", {
					name: deleteTarget?.name ?? "",
				})}
				description={t("admin.pose_manager_delete_desc")}
				confirmLabel={t("admin.pose_manager_delete")}
				danger
				loading={deleteLoading}
			/>

			{showForm && (
				<PoseFormModal
					pose={editingPose}
					onClose={() => {
						setShowForm(false);
						setEditingPose(null);
					}}
					onSaved={handleSavedPose}
				/>
			)}
		</section>
	);
}

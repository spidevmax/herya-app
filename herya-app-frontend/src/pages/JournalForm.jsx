import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronLeft, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
	createJournalEntry,
	getJournalEntryById,
	updateJournalEntry,
} from "@/api/journalEntries.api";
import { MOOD_OPTIONS } from "@/utils/constants";
import { Button, MoodSelector } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

const SENSATIONS = [
	"tight_shoulders",
	"sore_back",
	"sore_legs",
	"tight_hips",
	"low_energy",
	"high_energy",
	"focused",
	"distracted",
	"calm",
	"anxious",
	"headache",
	"stiff_neck",
];

const AUTO_NAVIGATE_DELAY = 2500;

const SensationChip = ({ label, active, onToggle }) => {
	return (
		<button
			type="button"
			onClick={onToggle}
			aria-pressed={active}
			className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${active ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-border-soft)]"}`}
		>
			{label}
		</button>
	);
};

const SuccessOverlay = ({ onDone, t }) => {
	useEffect(() => {
		const timer = setTimeout(onDone, AUTO_NAVIGATE_DELAY);
		return () => clearTimeout(timer);
	}, [onDone]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-primary)] text-white cursor-pointer"
			onClick={onDone}
			role="status"
			aria-live="polite"
		>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ type: "spring", delay: 0.1 }}
			>
				<div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6">
					<Check size={48} className="text-white" />
				</div>
			</motion.div>
			<h2 className="font-display text-2xl font-bold mb-2">
				{t("journal_form.success_title")}
			</h2>
			<p className="text-white/80 text-sm mb-8">
				{t("journal_form.success_hint")}
			</p>
			<button
				type="button"
				onClick={onDone}
				className="px-8 py-3 rounded-2xl bg-[var(--color-surface-card)] text-[var(--color-primary)] font-bold text-sm"
			>
				{t("journal_form.success_action")}
			</button>
		</motion.div>
	);
};

const validateForm = (form, t) => {
	const errors = [];
	if (!form.moodBefore || !MOOD_OPTIONS.includes(form.moodBefore)) {
		errors.push(t("journal_form.error_mood_required") || "Please select a mood before practice");
	}
	if (form.energyBefore < 1 || form.energyBefore > 10) {
		errors.push(t("journal_form.error_energy_range") || "Energy must be between 1 and 10");
	}
	if (form.stressBefore < 1 || form.stressBefore > 10) {
		errors.push(t("journal_form.error_stress_range") || "Stress must be between 1 and 10");
	}
	return errors;
};

const JournalForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const isEdit = Boolean(id);

	const [form, setForm] = useState({
		moodBefore: null,
		energyBefore: 5,
		stressBefore: 5,
		moodAfter: null,
		energyAfter: null,
		reflection: "",
		insights: "",
		physicalSensations: [],
		photos: [],
	});
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(isEdit);
	const [fetchError, setFetchError] = useState(false);
	const [saveError, setSaveError] = useState(null);
	const [validationErrors, setValidationErrors] = useState([]);
	const [success, setSuccess] = useState(false);
	const blobUrlsRef = useRef([]);

	// Revoke all blob URLs on unmount to prevent memory leaks
	useEffect(() => {
		const urls = blobUrlsRef.current;
		return () => {
			for (const url of urls) URL.revokeObjectURL(url);
		};
	}, []);

	useEffect(() => {
		if (!isEdit) return;
		getJournalEntryById(id)
			.then((r) => {
				const e = r.data?.data || r.data;
				if (e) setForm((f) => ({ ...f, ...e }));
			})
			.catch(() => setFetchError(true))
			.finally(() => setFetching(false));
	}, [id, isEdit]);

	const handleSave = async () => {
		setSaveError(null);
		setValidationErrors([]);

		const errors = validateForm(form, t);
		if (errors.length > 0) {
			setValidationErrors(errors);
			return;
		}

		setLoading(true);
		try {
			const payload = new FormData();
			payload.append("moodBefore", form.moodBefore);
			payload.append("energyBefore", form.energyBefore);
			payload.append("stressBefore", form.stressBefore);
			if (form.moodAfter) payload.append("moodAfter", form.moodAfter);
			if (form.energyAfter != null) payload.append("energyAfter", form.energyAfter);
			if (form.reflection) payload.append("reflection", form.reflection);
			if (form.insights) payload.append("insights", form.insights);
			form.physicalSensations.forEach((s) => {
				payload.append("physicalSensations[]", s);
			});
			form.photos.forEach((p) => {
				const file = p.file || p;
				if (file instanceof File) payload.append("photos", file);
			});

			if (isEdit) {
				await updateJournalEntry(id, payload);
			} else {
				await createJournalEntry(payload);
			}
			setSuccess(true);
		} catch (err) {
			const serverMsg =
				err?.response?.data?.message ||
				err?.response?.data?.error ||
				err?.message;
			setSaveError(
				serverMsg || t("journal_form.save_error") || "Failed to save entry",
			);
		} finally {
			setLoading(false);
		}
	};

	const toggleSensation = (s) => {
		setForm((f) => ({
			...f,
			physicalSensations: f.physicalSensations.includes(s)
				? f.physicalSensations.filter((x) => x !== s)
				: [...f.physicalSensations, s],
		}));
	};

	const removePhoto = (indexToRemove) => {
		setForm((f) => {
			const removed = f.photos[indexToRemove];
			if (removed?.previewUrl) {
				URL.revokeObjectURL(removed.previewUrl);
				blobUrlsRef.current = blobUrlsRef.current.filter(
					(u) => u !== removed.previewUrl,
				);
			}
			return {
				...f,
				photos: f.photos.filter((_, i) => i !== indexToRemove),
			};
		});
	};

	if (fetching) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
			</div>
		);
	}

	if (fetchError) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center">
				<p className="text-lg font-bold font-display text-[var(--color-text-primary)]">
					{t("journal_form.fetch_error")}
				</p>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-4 text-sm font-semibold"
					style={{ color: "var(--color-primary)" }}
				>
					{"\u2190"} {t("ui.cancel")}
				</button>
			</div>
		);
	}

	return (
		<>
			<AnimatePresence>
				{success && (
					<SuccessOverlay onDone={() => navigate("/journal")} t={t} />
				)}
			</AnimatePresence>

			<div className="flex flex-col pt-4 pb-28">
				<div className="flex items-center gap-3 px-4 mb-6">
					<button
						type="button"
						onClick={() => navigate(-1)}
						aria-label={t("ui.go_back") || "Go back"}
						className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-card)] shadow-sm"
					>
						<ChevronLeft
							size={20}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
						{isEdit
							? t("journal_form.edit_title")
							: t("journal_form.new_title")}
					</h1>
				</div>

				<div className="px-4 flex flex-col gap-6">
					{/* Before section */}
					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-4 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.before")}
						</h3>
						<MoodSelector
							value={form.moodBefore}
							onChange={(v) => setForm((f) => ({ ...f, moodBefore: v }))}
							label={t("journal_form.how_feeling")}
						/>
						<div className="mt-4">
							<label
								htmlFor="energy-before"
								className="flex items-center justify-between mb-2"
							>
								<span className="text-sm font-semibold text-[var(--color-text-primary)]">
									{t("journal_form.energy")}
								</span>
								<span className="text-sm font-bold text-[var(--color-primary)]">
									{form.energyBefore}/10
								</span>
							</label>
							<input
								id="energy-before"
								type="range"
								min={1}
								max={10}
								value={form.energyBefore}
								aria-label={t("journal_form.energy")}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										energyBefore: Number(e.target.value),
									}))
								}
								className="w-full accent-[var(--color-primary)]"
							/>
						</div>
						<div className="mt-4">
							<label
								htmlFor="stress-before"
								className="flex items-center justify-between mb-2"
							>
								<span className="text-sm font-semibold text-[var(--color-text-primary)]">
									{t("journal_form.stress")}
								</span>
								<span className="text-sm font-bold text-[var(--color-danger)]">
									{form.stressBefore}/10
								</span>
							</label>
							<input
								id="stress-before"
								type="range"
								min={1}
								max={10}
								value={form.stressBefore}
								aria-label={t("journal_form.stress")}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										stressBefore: Number(e.target.value),
									}))
								}
								className="w-full accent-[var(--color-danger)]"
							/>
						</div>
					</div>

					{/* Sensations */}
					<fieldset className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)] border-none">
						<legend className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.sensations")}
						</legend>
						<div className="flex flex-wrap gap-2">
							{SENSATIONS.map((s) => (
								<SensationChip
									key={s}
									label={t(`journal_form.sensations_map.${s}`)}
									active={form.physicalSensations.includes(s)}
									onToggle={() => toggleSensation(s)}
								/>
							))}
						</div>
					</fieldset>

					{/* Reflection */}
					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<label
							htmlFor="reflection"
							className="block mb-3 font-display font-bold text-[var(--color-text-primary)]"
						>
							{t("journal_form.reflection")}
						</label>
						<textarea
							id="reflection"
							value={form.reflection}
							onChange={(e) =>
								setForm((f) => ({ ...f, reflection: e.target.value }))
							}
							placeholder={t("journal_form.reflection_placeholder")}
							rows={4}
							className="w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
						/>
					</div>

					{/* Insights */}
					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<label
							htmlFor="insights"
							className="block mb-3 font-display font-bold text-[var(--color-text-primary)]"
						>
							{t("journal_form.insights")}
						</label>
						<textarea
							id="insights"
							value={form.insights}
							onChange={(e) =>
								setForm((f) => ({ ...f, insights: e.target.value }))
							}
							placeholder={t("journal_form.insights_placeholder")}
							rows={3}
							className="w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
						/>
					</div>

					{/* After section */}
					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-4 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.after")}
						</h3>
						<MoodSelector
							value={form.moodAfter}
							onChange={(v) => setForm((f) => ({ ...f, moodAfter: v }))}
							label={t("journal_form.how_feeling_after")}
						/>
						{form.moodAfter && (
							<div className="mt-4">
								<label
									htmlFor="energy-after"
									className="flex items-center justify-between mb-2"
								>
									<span className="text-sm font-semibold text-[var(--color-text-primary)]">
										{t("journal_form.energy_after")}
									</span>
									<span className="text-sm font-bold text-[var(--color-primary)]">
										{form.energyAfter ?? 5}/10
									</span>
								</label>
								<input
									id="energy-after"
									type="range"
									min={1}
									max={10}
									value={form.energyAfter ?? 5}
									aria-label={t("journal_form.energy_after")}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											energyAfter: Number(e.target.value),
										}))
									}
									className="w-full accent-[var(--color-primary)]"
								/>
							</div>
						)}
					</div>

					{/* Photos */}
					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.photos")}
						</h3>
						<label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] p-6 transition hover:border-[var(--color-primary)]">
							<Camera size={32} style={{ color: "var(--color-primary)" }} />
							<p className="text-sm text-[var(--color-text-secondary)]">
								{t("journal_form.photos_hint")}
							</p>
							<input
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={(e) => {
									const files = Array.from(e.target.files ?? []);
									const newEntries = files.map((file) => {
										const url = URL.createObjectURL(file);
										blobUrlsRef.current.push(url);
										return { file, previewUrl: url };
									});
									setForm((f) => ({
										...f,
										photos: [...f.photos, ...newEntries],
									}));
									e.target.value = "";
								}}
							/>
						</label>
						{form.photos.length > 0 && (
							<div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
								{form.photos.map((p, i) => {
									const url =
										p.previewUrl || (typeof p === "string" ? p : "");
									return (
										<div
											key={p.previewUrl || `photo-${url}`}
											className="relative flex-shrink-0"
										>
											<img
												src={url}
												alt={t("journal_form.photo_alt", { n: i + 1 })}
												className="w-20 h-20 rounded-xl object-cover"
											/>
											<button
												type="button"
												onClick={() => removePhoto(i)}
												aria-label={t("journal_form.remove_photo") || "Remove photo"}
												className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center shadow-sm"
											>
												<X size={12} />
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Validation errors */}
			<AnimatePresence>
				{validationErrors.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4"
					>
						<div
							className="rounded-2xl px-4 py-3 text-center text-sm font-semibold"
							role="alert"
							style={{
								backgroundColor: "var(--color-error-bg)",
								border: "1px solid var(--color-danger)",
								color: "var(--color-error-text)",
							}}
						>
							{validationErrors[0]}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Save error */}
			<AnimatePresence>
				{saveError && (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4"
					>
						<div
							className="rounded-2xl px-4 py-3 text-center text-sm font-semibold"
							role="alert"
							style={{
								backgroundColor: "var(--color-warning-bg)",
								border: "1px solid var(--color-warning-border)",
								color: "var(--color-text-primary)",
							}}
						>
							{saveError}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<motion.div
				initial={{ y: 80 }}
				animate={{ y: 0 }}
				className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4"
			>
				<Button
					size="lg"
					className="w-full"
					onClick={handleSave}
					loading={loading}
				>
					{isEdit ? t("journal_form.save_changes") : t("journal_form.save")}
				</Button>
			</motion.div>
		</>
	);
};

export default JournalForm;

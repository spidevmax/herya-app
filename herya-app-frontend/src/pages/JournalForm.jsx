import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronLeft, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
	createJournalEntry,
	getJournalEntryById,
	updateJournalEntry,
} from "@/api/journalEntries.api";
import { MOOD_AFTER_OPTIONS } from "@/utils/constants";
import { Button, MoodSelector } from "@/components/ui";
import JournalCard from "@/components/journal/JournalCard";
import SliderPanel from "@/components/journal/SliderPanel";
import SensationChips, {
	DEFAULT_SENSATIONS as SENSATIONS,
} from "@/components/journal/SensationChips";
import { useLanguage } from "@/context/LanguageContext";

const AUTO_NAVIGATE_DELAY = 2500;

const SOFT_PANEL_STYLE = {
	border: "1px solid color-mix(in srgb, var(--color-border-soft) 68%, transparent)",
	background:
		"linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, white 8%) 0%, var(--color-surface) 100%)",
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
	const moodBeforeArr = Array.isArray(form.moodBefore) ? form.moodBefore : [];
	if (moodBeforeArr.length === 0) {
		errors.push(t("journal_form.error_mood_required"));
	}
	const moodAfterArr = Array.isArray(form.moodAfter) ? form.moodAfter : [];
	if (moodAfterArr.length === 0) {
		errors.push(t("journal_form.error_mood_after_required"));
	}
	if (form.energyBefore < 1 || form.energyBefore > 10) {
		errors.push(t("journal_form.error_energy_range"));
	}
	if (form.stressBefore < 1 || form.stressBefore > 10) {
		errors.push(t("journal_form.error_stress_range"));
	}
	return errors;
};

const JournalForm = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const isEdit = Boolean(id);

	const [form, setForm] = useState({
		moodBefore: [],
		energyBefore: 5,
		stressBefore: 5,
		moodAfter: [],
		energyAfter: null,
		stressAfter: null,
		reflection: "",
		insights: "",
		gratitude: "",
		physicalSensations: [],
		photos: [],
		session: null,
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
				if (e) {
					setForm((f) => ({
						...f,
						moodBefore: Array.isArray(e.moodBefore) ? e.moodBefore : [],
						moodAfter: Array.isArray(e.moodAfter) ? e.moodAfter : [],
						energyBefore: e.energyLevel?.before ?? 5,
						energyAfter: e.energyLevel?.after ?? null,
						stressBefore: e.stressLevel?.before ?? 5,
						stressAfter: e.stressLevel?.after ?? null,
						reflection: e.emotionalNotes || "",
						insights: e.insights || "",
						gratitude: e.gratitude || "",
						physicalSensations: Array.isArray(e.physicalSensations)
							? e.physicalSensations
							: [],
						photos: (e.photos || []).map((p) => ({
							previewUrl: p.url,
							cloudinaryId: p.cloudinaryId,
						})),
						session: e.session?._id || e.session || null,
					}));
				}
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
			// Session ID (required for create)
			if (form.session) payload.append("session", form.session);
			// Backend expects arrays for moods
			if (Array.isArray(form.moodBefore)) {
				form.moodBefore.forEach((m) => {
					payload.append("moodBefore[]", m);
				});
			}
			if (Array.isArray(form.moodAfter)) {
				form.moodAfter.forEach((m) => {
					payload.append("moodAfter[]", m);
				});
			}
			// Send energyLevel and stressLevel as objects with before/after keys
			// Model requires both before and after — default after to 5 if not set
			payload.append("energyLevel[before]", form.energyBefore);
			payload.append("energyLevel[after]", form.energyAfter ?? 5);
			payload.append("stressLevel[before]", form.stressBefore);
			payload.append("stressLevel[after]", form.stressAfter ?? 5);
			if (form.reflection)
				payload.append("emotionalNotes", form.reflection);
			if (form.insights) payload.append("insights", form.insights);
			if (form.gratitude) payload.append("gratitude", form.gratitude);
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
				serverMsg || t("journal_form.save_error"),
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
					← {t("ui.go_back")}
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

			<div className="flex flex-col pt-4 pb-36">
				<div className="flex items-center gap-4 px-4 mb-6">
					<button
						type="button"
						onClick={() => navigate(-1)}
						aria-label={t("ui.go_back")}
						className="flex h-12 w-12 items-center justify-center rounded-full shadow-[var(--shadow-card)]"
						style={SOFT_PANEL_STYLE}
					>
						<ChevronLeft
							size={24}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<div>
						<h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
							{isEdit
								? t("journal_form.edit_title")
								: t("journal_form.new_title")}
						</h1>
						<p className="m-0 text-sm text-[var(--color-text-muted)]">
							{t("journal_form.header_subtitle")}
						</p>
					</div>
				</div>

				<div className="px-4 flex flex-col gap-6">
					{/* Before section */}
					<JournalCard
						title={t("journal_form.before")}
						subtitle={t("journal_form.before_subtitle")}
					>
						<MoodSelector
							value={form.moodBefore}
							onChange={(v) => setForm((f) => ({ ...f, moodBefore: v }))}
							label={t("journal_form.how_feeling")}
						/>
						<div className="mt-5 grid gap-4 lg:grid-cols-2">
							<SliderPanel
								id="energy-before"
								label={t("journal_form.energy")}
								value={form.energyBefore}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										energyBefore: Number(e.target.value),
									}))
								}
								accent="var(--color-primary)"
								lowLabel={t("journal_form.slider_low_energy")}
								highLabel={t("journal_form.slider_high_energy")}
							/>
							<SliderPanel
								id="stress-before"
								label={t("journal_form.stress")}
								value={form.stressBefore}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										stressBefore: Number(e.target.value),
									}))
								}
								accent="var(--color-danger)"
								lowLabel={t("journal_form.slider_low_stress")}
								highLabel={t("journal_form.slider_high_stress")}
							/>
						</div>
					</JournalCard>

					{/* Sensations */}
					<JournalCard
						title={t("journal_form.sensations")}
						subtitle={t("journal_form.sensations_subtitle")}
					>
						<SensationChips
							options={SENSATIONS}
							value={form.physicalSensations}
							onToggle={toggleSensation}
							getLabel={(s) => t(`journal.sensations.${s}`)}
						/>
					</JournalCard>

					{/* Reflection */}
					<JournalCard
						title={t("journal_form.reflection")}
						subtitle={t("journal_form.reflection_subtitle")}
					>
						<label
							htmlFor="reflection"
							className="sr-only"
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
							className="w-full resize-none rounded-[22px] p-4 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
							style={SOFT_PANEL_STYLE}
						/>
					</JournalCard>

					{/* Insights */}
					<JournalCard
						title={t("journal_form.insights")}
						subtitle={t("journal_form.insights_subtitle")}
					>
						<label
							htmlFor="insights"
							className="sr-only"
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
							className="w-full resize-none rounded-[22px] p-4 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
							style={SOFT_PANEL_STYLE}
						/>
					</JournalCard>

					{/* Gratitude */}
					<JournalCard
						title={t("journal_form.gratitude")}
						subtitle={t("journal_form.gratitude_subtitle")}
					>
						<label htmlFor="gratitude" className="sr-only">
							{t("journal_form.gratitude")}
						</label>
						<textarea
							id="gratitude"
							value={form.gratitude}
							onChange={(e) =>
								setForm((f) => ({ ...f, gratitude: e.target.value }))
							}
							placeholder={t("journal_form.gratitude_placeholder")}
							rows={3}
							className="w-full resize-none rounded-[22px] p-4 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
							style={SOFT_PANEL_STYLE}
						/>
					</JournalCard>

					{/* After section */}
					<JournalCard
						title={t("journal_form.after")}
						subtitle={t("journal_form.after_subtitle")}
					>
						<MoodSelector
							value={form.moodAfter}
							onChange={(v) => setForm((f) => ({ ...f, moodAfter: v }))}
							label={t("journal_form.how_feeling_after")}
							options={MOOD_AFTER_OPTIONS}
						/>
						<div className="mt-5 grid gap-4 lg:grid-cols-2">
							<SliderPanel
								id="energy-after"
								label={t("journal_form.energy_after")}
								value={form.energyAfter ?? 5}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										energyAfter: Number(e.target.value),
									}))
								}
								accent="var(--color-primary)"
								lowLabel={t("journal_form.slider_low_energy")}
								highLabel={t("journal_form.slider_high_energy")}
							/>
							<SliderPanel
								id="stress-after"
								label={t("journal_form.stress_after")}
								value={form.stressAfter ?? 5}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										stressAfter: Number(e.target.value),
									}))
								}
								accent="var(--color-danger)"
								lowLabel={t("journal_form.slider_low_stress")}
								highLabel={t("journal_form.slider_high_stress")}
							/>
						</div>
					</JournalCard>

					{/* Photos */}
					<JournalCard
						title={t("journal_form.photos")}
						subtitle={t("journal_form.photos_subtitle")}
					>
						<label
							className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[24px] p-6 transition hover:border-[var(--color-primary)]"
							style={{
								...SOFT_PANEL_STYLE,
								borderStyle: "dashed",
								borderWidth: "2px",
							}}
						>
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
									const url = p.previewUrl || (typeof p === "string" ? p : "");
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
												aria-label={
													t("journal_form.remove_photo")
												}
												className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--color-danger)] text-white flex items-center justify-center shadow-sm"
											>
												<X size={12} />
											</button>
										</div>
									);
								})}
							</div>
						)}
					</JournalCard>
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
				className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 w-full max-w-[560px] px-4"
			>
				<div
					className="rounded-[28px] p-3 shadow-[0_18px_44px_rgba(20,38,74,0.16)] backdrop-blur-sm"
					style={{
						background:
							"linear-gradient(180deg, color-mix(in srgb, var(--color-surface-card) 90%, white 10%) 0%, color-mix(in srgb, var(--color-surface-card) 96%, transparent) 100%)",
						border:
							"1px solid color-mix(in srgb, var(--color-border-soft) 72%, transparent)",
					}}
				>
					<Button
						size="lg"
						className="w-full"
						onClick={handleSave}
						loading={loading}
					>
						{isEdit ? t("journal_form.save_changes") : t("journal_form.save")}
					</Button>
				</div>
			</motion.div>
		</>
	);
};

export default JournalForm;

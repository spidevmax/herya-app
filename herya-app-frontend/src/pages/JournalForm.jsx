import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
	createJournalEntry,
	getJournalEntryById,
	updateJournalEntry,
} from "@/api/journalEntries.api";
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

function SensationChip({ label, active, onToggle }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${active ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface-card)] text-[var(--color-text-secondary)] border-[var(--color-border-soft)]"}`}
		>
			{label}
		</button>
	);
}

function SuccessOverlay({ onDone, t }) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-primary)] text-white"
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
			<h2
				className="font-display text-2xl font-bold mb-2"
				style={{ fontFamily: '"Fredoka", sans-serif' }}
			>
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
}

export default function JournalForm() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();
	const isEdit = Boolean(id);

	const [form, setForm] = useState({
		moodBefore: 3,
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
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (!isEdit) return;
		getJournalEntryById(id)
			.then((r) => {
				const e = r.data?.data || r.data;
				if (e) setForm((f) => ({ ...f, ...e }));
			})
			.finally(() => setFetching(false));
	}, [id, isEdit]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const payload = new FormData();
			payload.append("moodBefore", form.moodBefore);
			payload.append("energyBefore", form.energyBefore);
			payload.append("stressBefore", form.stressBefore);
			if (form.moodAfter) payload.append("moodAfter", form.moodAfter);
			if (form.energyAfter) payload.append("energyAfter", form.energyAfter);
			if (form.reflection) payload.append("reflection", form.reflection);
			if (form.insights) payload.append("insights", form.insights);
			form.physicalSensations.forEach((s) => {
				payload.append("physicalSensations[]", s);
			});
			form.photos.forEach((p) => {
				if (p instanceof File) payload.append("photos", p);
			});

			if (isEdit) {
				await updateJournalEntry(id, payload);
			} else {
				await createJournalEntry(payload);
			}
			setSuccess(true);
		} catch {
			// let user retry
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

	if (fetching) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
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
						className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-card)] shadow-sm"
					>
						<ChevronLeft
							size={20}
							className="text-[var(--color-text-secondary)]"
						/>
					</button>
					<h1
						className="font-display text-xl font-bold"
						style={{
							fontFamily: '"Fredoka", sans-serif',
							color: "var(--color-text-primary)",
						}}
					>
						{isEdit
							? t("journal_form.edit_title")
							: t("journal_form.new_title")}
					</h1>
				</div>

				<div className="px-4 flex flex-col gap-6">
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
							<div className="flex items-center justify-between mb-2">
								<p className="text-sm font-semibold text-[var(--color-text-primary)]">
									{t("journal_form.energy")}
								</p>
								<span className="text-sm font-bold text-[var(--color-primary)]">
									{form.energyBefore}/10
								</span>
							</div>
							<input
								type="range"
								min={1}
								max={10}
								value={form.energyBefore}
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
							<div className="flex items-center justify-between mb-2">
								<p className="text-sm font-semibold text-[var(--color-text-primary)]">
									{t("journal_form.stress")}
								</p>
								<span className="text-sm font-bold text-[var(--color-danger)]">
									{form.stressBefore}/10
								</span>
							</div>
							<input
								type="range"
								min={1}
								max={10}
								value={form.stressBefore}
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

					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.sensations")}
						</h3>
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
					</div>

					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.reflection")}
						</h3>
						<textarea
							value={form.reflection}
							onChange={(e) =>
								setForm((f) => ({ ...f, reflection: e.target.value }))
							}
							placeholder={t("journal_form.reflection_placeholder")}
							rows={4}
							className="w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
						/>
					</div>

					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.insights")}
						</h3>
						<textarea
							value={form.insights}
							onChange={(e) =>
								setForm((f) => ({ ...f, insights: e.target.value }))
							}
							placeholder={t("journal_form.insights_placeholder")}
							rows={3}
							className="w-full resize-none rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
						/>
					</div>

					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3
							className="mb-4 font-display font-bold"
							style={{
								fontFamily: '"Fredoka", sans-serif',
								color: "var(--color-text-primary)",
							}}
						>
							{t("journal_form.after")}
						</h3>
						<MoodSelector
							value={form.moodAfter}
							onChange={(v) => setForm((f) => ({ ...f, moodAfter: v }))}
							label={t("journal_form.how_feeling_after")}
						/>
						{form.moodAfter && (
							<div className="mt-4">
								<div className="flex items-center justify-between mb-2">
									<p className="text-sm font-semibold text-[var(--color-text-primary)]">
										{t("journal_form.energy_after")}
									</p>
									<span className="text-sm font-bold text-[var(--color-primary)]">
										{form.energyAfter ?? 5}/10
									</span>
								</div>
								<input
									type="range"
									min={1}
									max={10}
									value={form.energyAfter ?? 5}
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

					<div className="rounded-3xl bg-[var(--color-surface-card)] p-5 shadow-[var(--shadow-card)]">
						<h3 className="mb-3 font-display font-bold text-[var(--color-text-primary)]">
							{t("journal_form.photos")}
						</h3>
						<label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-border-soft)] p-6 transition hover:border-[var(--color-primary)]">
							<span className="text-3xl">📷</span>
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
									setForm((f) => ({ ...f, photos: [...f.photos, ...files] }));
								}}
							/>
						</label>
						{form.photos.length > 0 && (
							<div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
								{form.photos.map((p, i) => {
									const url = p instanceof File ? URL.createObjectURL(p) : p;
									return (
										<img
											key={`photo-${url.slice(-8)}`}
											src={url}
											alt={t("journal_form.photo_alt", { n: i + 1 })}
											className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
										/>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

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
}

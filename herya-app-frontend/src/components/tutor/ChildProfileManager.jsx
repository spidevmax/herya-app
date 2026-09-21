import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	createChildProfile,
	getChildProfiles,
	updateChildProfile,
} from "@/api/childProfiles.api";
import { getSessionStats } from "@/api/sessions.api";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const AVATAR_COLORS = [
	"#7C6FD4",
	"#5DB075",
	"#FFB347",
	"#FF6B6B",
	"#87CEEB",
	"#E8A0BF",
	"#B4D455",
	"#9B59B6",
];

/**
 * ChildProfileManager — tutor-facing UI to manage child profiles.
 * Supports creating, editing, and selecting a child for the session.
 *
 * Props:
 * - selectedChildId: currently selected child profile ID
 * - onSelectChild: callback (profile) when a child is selected
 * - compact: smaller mode for embedding in session flow
 */
const ChildProfileManager = ({
	selectedChildId,
	onSelectChild,
	compact = false,
}) => {
	const { t } = useLanguage();
	const [profiles, setProfiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingProfile, setEditingProfile] = useState(null);
	const [form, setForm] = useState(defaultForm());
	// Cifras de practica por nino, guardadas por id: { [childId]: { streak, minutes } }
	const [statsByChild, setStatsByChild] = useState({});

	function defaultForm() {
		return {
			name: "",
			age: "",
			avatarColor: AVATAR_COLORS[0],
			safetyAnchors: { phrase: "", bodyCue: "" },
			knownTriggers: [],
			notes: "",
		};
	}

	/*
	 * Las sesiones que el tutor guia para un nino se guardan bajo la cuenta del
	 * tutor, con el id del nino dentro. El backend sabe devolver las cifras de
	 * un nino concreto, pero de uno en uno, asi que pedimos una por perfil y las
	 * lanzamos a la vez en lugar de esperar a que acabe cada una.
	 *
	 * Esto va aparte de la carga de perfiles: si falla, la lista se sigue
	 * viendo, solo que sin cifras. Elegir un nino es lo importante aqui.
	 */
	const loadStats = useCallback(async (list) => {
		if (list.length === 0) return;

		const results = await Promise.all(
			list.map(async (profile) => {
				try {
					const res = await getSessionStats(profile._id);
					const data = res.data?.data || {};
					return [
						profile._id,
						{
							streak: data.currentStreak || 0,
							minutes: data.totalMinutes || 0,
						},
					];
				} catch {
					return null;
				}
			}),
		);

		setStatsByChild(Object.fromEntries(results.filter(Boolean)));
	}, []);

	// useCallback so the mount effect can list it as a dependency; without a
	// stable identity it would refetch on every render.
	const loadProfiles = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getChildProfiles();
			const data = res.data?.data || res.data || [];
			const list = Array.isArray(data) ? data : [];
			setProfiles(list);
			loadStats(list);
		} catch {
			setProfiles([]);
		} finally {
			setLoading(false);
		}
	}, [loadStats]);

	useEffect(() => {
		loadProfiles();
	}, [loadProfiles]);

	const handleSave = async () => {
		if (!form.name.trim()) return;

		const payload = {
			...form,
			age: form.age ? Number(form.age) : undefined,
		};

		try {
			if (editingProfile) {
				const res = await updateChildProfile(editingProfile._id, payload);
				const updated = res.data?.data || res.data;
				setProfiles((prev) =>
					prev.map((p) => (p._id === updated._id ? updated : p)),
				);
			} else {
				const res = await createChildProfile(payload);
				const created = res.data?.data || res.data;
				setProfiles((prev) => [...prev, created]);
			}
			setShowForm(false);
			setEditingProfile(null);
			setForm(defaultForm());
		} catch {
			// silently fail
		}
	};

	const openEdit = (profile) => {
		setEditingProfile(profile);
		setForm({
			name: profile.name || "",
			age: profile.age || "",
			avatarColor: profile.avatarColor || AVATAR_COLORS[0],
			safetyAnchors: {
				phrase: profile.safetyAnchors?.phrase || "",
				bodyCue: profile.safetyAnchors?.bodyCue || "",
			},
			knownTriggers: profile.knownTriggers || [],
			notes: profile.notes || "",
		});
		setShowForm(true);
	};

	const updateField = (path, value) => {
		setForm((prev) => {
			const copy = { ...prev };
			const parts = path.split(".");
			let target = copy;
			for (let i = 0; i < parts.length - 1; i++) {
				target[parts[i]] = { ...target[parts[i]] };
				target = target[parts[i]];
			}
			target[parts[parts.length - 1]] = value;
			return copy;
		});
	};

	return (
		<section
			aria-labelledby="child-profiles-heading"
			className={`rounded-2xl ${compact ? "p-3" : "p-4"}`}
			style={{
				backgroundColor: "var(--paper-raised)",
				border: "var(--ink-width) solid var(--ink)",
			}}
		>
			<header className="flex items-center justify-between mb-3">
				<h2
					id="child-profiles-heading"
					className="text-[10px] font-bold"
					style={{ color: "var(--ink-soft)" }}
				>
					{t("tutor.child_profiles_title")}
				</h2>
				<button
					type="button"
					onClick={() => {
						setEditingProfile(null);
						setForm(defaultForm());
						setShowForm(true);
					}}
					className="flex cursor-pointer items-center gap-1 px-2 py-1 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
					style={{
						background: "var(--paper-raised)",
						color: "var(--ink)",
						border: "var(--ink-width) solid var(--ink)",
						borderRadius: "var(--radius-block)",
					}}
					aria-label={t("tutor.add_child")}
				>
					<UserPlus size={14} aria-hidden="true" />
					{t("tutor.add_child")}
				</button>
			</header>

			{/* Profile list */}
			{loading ? (
				<output
					className="block text-xs"
					aria-live="polite"
					style={{ color: "var(--ink-soft)" }}
				>
					{t("ui.loading")}...
				</output>
			) : profiles.length === 0 && !showForm ? (
				<p className="text-xs" style={{ color: "var(--ink-soft)" }}>
					{t("tutor.no_children")}
				</p>
			) : (
				<ul className="flex flex-col gap-2 list-none m-0 p-0">
					{profiles.map((profile) => {
						const isSelected = selectedChildId === profile._id;
						const stats = statsByChild[profile._id];
						// Un nino sin sesiones todavia no tiene nada que contar.
						// "Racha de 0 dias" no informa, asi que no se muestra.
						const hasStats = stats && stats.minutes > 0;
						return (
							<li
								key={profile._id}
								className="flex items-center gap-2 rounded-xl transition-all"
								style={{
									backgroundColor: isSelected
										? profile.avatarColor
										: "var(--paper)",
									border: isSelected
										? `2px solid ${profile.avatarColor}`
										: "var(--ink-width) solid var(--ink)",
								}}
							>
								<button
									type="button"
									onClick={() => onSelectChild?.(profile)}
									className="flex flex-1 items-center gap-3 px-3 py-2.5 rounded-xl text-left min-h-[48px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chandra)]"
									aria-pressed={isSelected}
									aria-label={profile.name}
								>
									<span
										aria-hidden="true"
										className="flex h-9 w-9 min-w-[2.25rem] items-center justify-center rounded-full text-sm font-bold"
										style={{
											backgroundColor: profile.avatarColor,
											color: "var(--on-fill)",
											border: "var(--ink-width) solid var(--ink)",
										}}
									>
										{profile.name.charAt(0).toUpperCase()}
									</span>
									<span className="flex-1 min-w-0">
										<span
											className="block text-sm font-semibold truncate"
											style={{ color: "var(--ink)" }}
										>
											{profile.name}
										</span>
										{profile.age && (
											<span
												className="block text-[10px]"
												style={{ color: "var(--ink-soft)" }}
											>
												{t("tutor.child_age", { n: profile.age })}
											</span>
										)}
										{hasStats && (
											<span
												className="block text-[10px]"
												style={{ color: "var(--ink-soft)" }}
											>
												{t("tutor.child_stats", {
													streak: stats.streak,
													minutes: stats.minutes,
												})}
											</span>
										)}
									</span>
									{isSelected ? (
										<Check
											size={16}
											aria-hidden="true"
											style={{ color: profile.avatarColor }}
										/>
									) : null}
								</button>
								<button
									type="button"
									onClick={() => openEdit(profile)}
									className="w-8 h-8 mr-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--paper-raised)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chandra)]"
									style={{ color: "var(--ink-soft)" }}
									aria-label={t("tutor.edit_child")}
								>
									<Pencil size={14} aria-hidden="true" />
								</button>
							</li>
						);
					})}
				</ul>
			)}

			{/* Create/Edit Form */}
			<AnimatePresence>
				{showForm && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="overflow-hidden mt-3"
					>
						<form
							aria-labelledby="child-profile-form-heading"
							onSubmit={(e) => {
								e.preventDefault();
								handleSave();
							}}
							className="rounded-xl p-4 flex flex-col gap-3"
							style={{
								backgroundColor: "var(--paper)",
								border: "var(--ink-width) solid var(--ink)",
							}}
						>
							<header className="flex justify-between items-center">
								<h3
									id="child-profile-form-heading"
									className="text-sm font-semibold"
									style={{ color: "var(--ink)" }}
								>
									{editingProfile
										? t("tutor.edit_child_title")
										: t("tutor.new_child_title")}
								</h3>
								<button
									type="button"
									onClick={() => {
										setShowForm(false);
										setEditingProfile(null);
									}}
									aria-label={t("ui.close_modal")}
								>
									<X
										size={16}
										aria-hidden="true"
										style={{ color: "var(--ink-soft)" }}
									/>
								</button>
							</header>

							{/* Name */}
							<label htmlFor="child-profile-name" className="sr-only">
								{t("tutor.child_name")}
							</label>
							<input
								id="child-profile-name"
								type="text"
								value={form.name}
								onChange={(e) => updateField("name", e.target.value)}
								placeholder={t("tutor.child_name")}
								maxLength={60}
								className="text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--paper-raised)",
									color: "var(--ink)",
									"--tw-ring-color": "var(--surya)",
								}}
							/>

							{/* Age */}
							<label htmlFor="child-profile-age" className="sr-only">
								{t("tutor.child_age_placeholder")}
							</label>
							<input
								id="child-profile-age"
								type="number"
								value={form.age}
								onChange={(e) => updateField("age", e.target.value)}
								placeholder={t("tutor.child_age_placeholder")}
								min={3}
								max={18}
								className="text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--paper-raised)",
									color: "var(--ink)",
									"--tw-ring-color": "var(--surya)",
								}}
							/>

							{/* Avatar color */}
							<fieldset className="border-0 p-0 m-0">
								<legend
									className="text-xs font-medium mb-1"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("tutor.avatar_color")}
								</legend>
								<div className="flex gap-2 flex-wrap">
									{AVATAR_COLORS.map((c) => (
										<button
											key={c}
											type="button"
											aria-pressed={form.avatarColor === c}
											onClick={() => updateField("avatarColor", c)}
											className="w-8 h-8 rounded-full transition-all min-w-[2rem]"
											style={{
												backgroundColor: c,
												border:
													form.avatarColor === c
														? "3px solid var(--ink)"
														: "3px solid transparent",
											}}
											aria-label={c}
										/>
									))}
								</div>
							</fieldset>

							{/* Safety anchors */}
							<fieldset className="border-0 p-0 m-0">
								<legend
									className="text-xs font-medium mb-1"
									style={{ color: "var(--ink-soft)" }}
								>
									{t("tutor.safety_anchors")}
								</legend>
								<label htmlFor="child-anchor-phrase" className="sr-only">
									{t("tutor.anchor_phrase_placeholder")}
								</label>
								<input
									id="child-anchor-phrase"
									type="text"
									value={form.safetyAnchors.phrase}
									onChange={(e) =>
										updateField("safetyAnchors.phrase", e.target.value)
									}
									placeholder={t("tutor.anchor_phrase_placeholder")}
									maxLength={120}
									className="w-full text-sm rounded-xl px-3 py-2 mb-2 outline-none focus:ring-1"
									style={{
										backgroundColor: "var(--paper-raised)",
										color: "var(--ink)",
										"--tw-ring-color": "var(--surya)",
									}}
								/>
								<label htmlFor="child-anchor-bodycue" className="sr-only">
									{t("tutor.anchor_body_cue_placeholder")}
								</label>
								<input
									id="child-anchor-bodycue"
									type="text"
									value={form.safetyAnchors.bodyCue}
									onChange={(e) =>
										updateField("safetyAnchors.bodyCue", e.target.value)
									}
									placeholder={t("tutor.anchor_body_cue_placeholder")}
									maxLength={120}
									className="w-full text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
									style={{
										backgroundColor: "var(--paper-raised)",
										color: "var(--ink)",
										"--tw-ring-color": "var(--surya)",
									}}
								/>
							</fieldset>

							{/* Notes */}
							<label htmlFor="child-profile-notes" className="sr-only">
								{t("tutor.child_notes_placeholder")}
							</label>
							<textarea
								id="child-profile-notes"
								value={form.notes}
								onChange={(e) => updateField("notes", e.target.value)}
								placeholder={t("tutor.child_notes_placeholder")}
								rows={2}
								maxLength={2000}
								className="w-full text-sm rounded-xl p-3 resize-none outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--paper-raised)",
									color: "var(--ink)",
									"--tw-ring-color": "var(--surya)",
								}}
							/>

							<Button
								type="submit"
								disabled={!form.name.trim()}
								size="md"
								className="w-full"
							>
								{editingProfile
									? t("tutor.save_changes")
									: t("tutor.create_child")}
							</Button>
						</form>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
};

export default ChildProfileManager;

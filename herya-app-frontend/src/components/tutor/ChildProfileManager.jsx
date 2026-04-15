import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ChevronRight, Pencil, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui";
import {
	getChildProfiles,
	createChildProfile,
	updateChildProfile,
} from "@/api/childProfiles.api";

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

const THEME_OPTIONS = ["light", "dark", "nature", "ocean", "sunset"];
const SOUND_OPTIONS = ["nature", "simple_tones", "silence"];
const ANIMATION_OPTIONS = ["slow", "normal", "reduced"];

/**
 * ChildProfileManager — tutor-facing UI to manage child profiles.
 * Supports creating, editing, and selecting a child for the session.
 *
 * Props:
 * - selectedChildId: currently selected child profile ID
 * - onSelectChild: callback (profile) when a child is selected
 * - compact: smaller mode for embedding in session flow
 */
export default function ChildProfileManager({
	selectedChildId,
	onSelectChild,
	compact = false,
}) {
	const { t } = useLanguage();
	const [profiles, setProfiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingProfile, setEditingProfile] = useState(null);
	const [form, setForm] = useState(defaultForm());

	function defaultForm() {
		return {
			name: "",
			age: "",
			avatarColor: AVATAR_COLORS[0],
			sensoryPreferences: {
				lowStimDefault: true,
				preferredTheme: "light",
				soundPalette: "simple_tones",
				animationSpeed: "slow",
			},
			safetyAnchors: { phrase: "", bodyCue: "" },
			knownTriggers: [],
			notes: "",
		};
	}

	useEffect(() => {
		loadProfiles();
	}, []);

	const loadProfiles = async () => {
		setLoading(true);
		try {
			const res = await getChildProfiles();
			const data = res.data?.data || res.data || [];
			setProfiles(Array.isArray(data) ? data : []);
		} catch {
			setProfiles([]);
		} finally {
			setLoading(false);
		}
	};

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
			sensoryPreferences: {
				lowStimDefault:
					profile.sensoryPreferences?.lowStimDefault ?? true,
				preferredTheme:
					profile.sensoryPreferences?.preferredTheme || "light",
				soundPalette:
					profile.sensoryPreferences?.soundPalette || "simple_tones",
				animationSpeed:
					profile.sensoryPreferences?.animationSpeed || "slow",
			},
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
		<div
			className={`rounded-2xl ${compact ? "p-3" : "p-4"}`}
			style={{
				backgroundColor: "var(--color-surface-card)",
				border: "1px solid var(--color-border-soft)",
			}}
		>
			<div className="flex items-center justify-between mb-3">
				<p
					className="text-[10px] font-bold uppercase tracking-[0.1em]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{t("tutor.child_profiles_title")}
				</p>
				<button
					type="button"
					onClick={() => {
						setEditingProfile(null);
						setForm(defaultForm());
						setShowForm(true);
					}}
					className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
					style={{
						backgroundColor: "var(--color-surface)",
						color: "var(--color-primary)",
					}}
					aria-label={t("tutor.add_child")}
				>
					<UserPlus size={14} />
					{t("tutor.add_child")}
				</button>
			</div>

			{/* Profile list */}
			{loading ? (
				<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
					{t("ui.loading")}...
				</p>
			) : profiles.length === 0 && !showForm ? (
				<p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
					{t("tutor.no_children")}
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{profiles.map((profile) => {
						const isSelected = selectedChildId === profile._id;
						return (
							<button
								key={profile._id}
								type="button"
								onClick={() => onSelectChild?.(profile)}
								className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all min-h-[48px]"
								style={{
									backgroundColor: isSelected
										? `color-mix(in srgb, ${profile.avatarColor} 12%, transparent)`
										: "var(--color-surface)",
									border: isSelected
										? `2px solid ${profile.avatarColor}`
										: "2px solid var(--color-border-soft)",
								}}
								aria-pressed={isSelected}
								aria-label={profile.name}
							>
								<div
									className="w-9 h-9 min-w-[2.25rem] rounded-full flex items-center justify-center text-white text-sm font-bold"
									style={{ backgroundColor: profile.avatarColor }}
								>
									{profile.name.charAt(0).toUpperCase()}
								</div>
								<div className="flex-1 min-w-0">
									<p
										className="text-sm font-semibold truncate"
										style={{ color: "var(--color-text-primary)" }}
									>
										{profile.name}
									</p>
									{profile.age && (
										<p
											className="text-[10px]"
											style={{ color: "var(--color-text-muted)" }}
										>
											{t("tutor.child_age", { n: profile.age })}
										</p>
									)}
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											openEdit(profile);
										}}
										className="w-8 h-8 rounded-lg flex items-center justify-center"
										style={{ color: "var(--color-text-muted)" }}
										aria-label={t("tutor.edit_child")}
									>
										<Pencil size={14} />
									</button>
									<ChevronRight
										size={16}
										style={{ color: "var(--color-text-muted)" }}
									/>
								</div>
							</button>
						);
					})}
				</div>
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
						<div
							className="rounded-xl p-4 flex flex-col gap-3"
							style={{
								backgroundColor: "var(--color-surface)",
								border: "1px solid var(--color-border-soft)",
							}}
						>
							<div className="flex justify-between items-center">
								<p
									className="text-sm font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{editingProfile
										? t("tutor.edit_child_title")
										: t("tutor.new_child_title")}
								</p>
								<button
									type="button"
									onClick={() => {
										setShowForm(false);
										setEditingProfile(null);
									}}
									aria-label={t("ui.close_modal")}
								>
									<X size={16} style={{ color: "var(--color-text-muted)" }} />
								</button>
							</div>

							{/* Name */}
							<input
								type="text"
								value={form.name}
								onChange={(e) => updateField("name", e.target.value)}
								placeholder={t("tutor.child_name")}
								maxLength={60}
								className="text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--color-surface-card)",
									color: "var(--color-text-primary)",
									"--tw-ring-color": "var(--color-secondary)",
								}}
							/>

							{/* Age */}
							<input
								type="number"
								value={form.age}
								onChange={(e) => updateField("age", e.target.value)}
								placeholder={t("tutor.child_age_placeholder")}
								min={3}
								max={18}
								className="text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--color-surface-card)",
									color: "var(--color-text-primary)",
									"--tw-ring-color": "var(--color-secondary)",
								}}
							/>

							{/* Avatar color */}
							<div>
								<p
									className="text-xs font-medium mb-1"
									style={{ color: "var(--color-text-secondary)" }}
								>
									{t("tutor.avatar_color")}
								</p>
								<div className="flex gap-2 flex-wrap">
									{AVATAR_COLORS.map((c) => (
										<button
											key={c}
											type="button"
											onClick={() => updateField("avatarColor", c)}
											className="w-8 h-8 rounded-full transition-all min-w-[2rem]"
											style={{
												backgroundColor: c,
												border:
													form.avatarColor === c
														? "3px solid var(--color-text-primary)"
														: "3px solid transparent",
											}}
											aria-label={c}
										/>
									))}
								</div>
							</div>

							{/* Sensory preferences */}
							<div>
								<p
									className="text-xs font-medium mb-2"
									style={{ color: "var(--color-text-secondary)" }}
								>
									{t("tutor.sensory_prefs")}
								</p>
								<div className="grid grid-cols-1 gap-2">
									<select
										value={form.sensoryPreferences.preferredTheme}
										onChange={(e) =>
											updateField(
												"sensoryPreferences.preferredTheme",
												e.target.value,
											)
										}
										className="text-sm rounded-xl px-3 py-2"
										style={{
											backgroundColor: "var(--color-surface-card)",
											color: "var(--color-text-primary)",
										}}
									>
										{THEME_OPTIONS.map((opt) => (
											<option key={opt} value={opt}>
												{t(`tutor.theme_${opt}`)}
											</option>
										))}
									</select>
									<select
										value={form.sensoryPreferences.soundPalette}
										onChange={(e) =>
											updateField(
												"sensoryPreferences.soundPalette",
												e.target.value,
											)
										}
										className="text-sm rounded-xl px-3 py-2"
										style={{
											backgroundColor: "var(--color-surface-card)",
											color: "var(--color-text-primary)",
										}}
									>
										{SOUND_OPTIONS.map((opt) => (
											<option key={opt} value={opt}>
												{t(`tutor.sound_${opt}`)}
											</option>
										))}
									</select>
									<select
										value={form.sensoryPreferences.animationSpeed}
										onChange={(e) =>
											updateField(
												"sensoryPreferences.animationSpeed",
												e.target.value,
											)
										}
										className="text-sm rounded-xl px-3 py-2"
										style={{
											backgroundColor: "var(--color-surface-card)",
											color: "var(--color-text-primary)",
										}}
									>
										{ANIMATION_OPTIONS.map((opt) => (
											<option key={opt} value={opt}>
												{t(`tutor.animation_${opt}`)}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Safety anchors */}
							<div>
								<p
									className="text-xs font-medium mb-1"
									style={{ color: "var(--color-text-secondary)" }}
								>
									{t("tutor.safety_anchors")}
								</p>
								<input
									type="text"
									value={form.safetyAnchors.phrase}
									onChange={(e) =>
										updateField("safetyAnchors.phrase", e.target.value)
									}
									placeholder={t("tutor.anchor_phrase_placeholder")}
									maxLength={120}
									className="w-full text-sm rounded-xl px-3 py-2 mb-2 outline-none focus:ring-1"
									style={{
										backgroundColor: "var(--color-surface-card)",
										color: "var(--color-text-primary)",
										"--tw-ring-color": "var(--color-secondary)",
									}}
								/>
								<input
									type="text"
									value={form.safetyAnchors.bodyCue}
									onChange={(e) =>
										updateField("safetyAnchors.bodyCue", e.target.value)
									}
									placeholder={t("tutor.anchor_body_cue_placeholder")}
									maxLength={120}
									className="w-full text-sm rounded-xl px-3 py-2 outline-none focus:ring-1"
									style={{
										backgroundColor: "var(--color-surface-card)",
										color: "var(--color-text-primary)",
										"--tw-ring-color": "var(--color-secondary)",
									}}
								/>
							</div>

							{/* Notes */}
							<textarea
								value={form.notes}
								onChange={(e) => updateField("notes", e.target.value)}
								placeholder={t("tutor.child_notes_placeholder")}
								rows={2}
								maxLength={2000}
								className="w-full text-sm rounded-xl p-3 resize-none outline-none focus:ring-1"
								style={{
									backgroundColor: "var(--color-surface-card)",
									color: "var(--color-text-primary)",
									"--tw-ring-color": "var(--color-secondary)",
								}}
							/>

							<Button
								onClick={handleSave}
								disabled={!form.name.trim()}
								size="md"
								className="w-full"
							>
								{editingProfile ? t("tutor.save_changes") : t("tutor.create_child")}
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

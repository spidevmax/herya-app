import { motion } from "framer-motion";
import { Camera, LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	deleteMyAccount,
	updateProfile,
	updateProfileImage,
} from "@/api/users.api";
import { Button, ConfirmModal, LoadingSpinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const GOAL_OPTIONS = [
	"increase_flexibility",
	"build_strength",
	"reduce_stress",
	"improve_balance",
	"therapeutic_healing",
	"deepen_practice",
	"meditation_focus",
	"breath_awareness",
];

const PRACTICE_INTENSITIES = ["gentle", "moderate", "vigorous"];
const TIME_OF_DAY_OPTIONS = ["morning", "afternoon", "evening", "anytime"];

const toArray = (value) => (Array.isArray(value) ? value : []);

const createInitialDraft = (user) => ({
	name: user?.name ?? "",
	email: user?.email ?? "",
	pronouns: user?.pronouns ?? "",
	goals: toArray(user?.goals),
	preferences: {
		practiceIntensity: user?.preferences?.practiceIntensity ?? "moderate",
		sessionDuration: user?.preferences?.sessionDuration ?? 30,
		timeOfDay: user?.preferences?.timeOfDay ?? "anytime",
		language: user?.preferences?.language ?? "en",
		theme: user?.preferences?.theme ?? "light",
		lowStimMode: user?.preferences?.lowStimMode ?? false,
		safetyAnchors: {
			phrase: user?.preferences?.safetyAnchors?.phrase ?? "",
			bodyCue: user?.preferences?.safetyAnchors?.bodyCue ?? "",
		},
	},
});

const cardStyle = { backgroundColor: "var(--color-surface-card)" };
const inputStyle = {
	backgroundColor: "var(--color-surface)",
	borderColor: "var(--color-border)",
	color: "var(--color-text-primary)",
};

function getUserInitials(name) {
	if (!name?.trim()) return "?";
	return name
		.trim()
		.split(/\s+/)
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function SectionTitle({ children }) {
	return (
		<p
			className="text-[11px] font-bold uppercase tracking-[0.12em]"
			style={{ color: "var(--color-text-muted)" }}
		>
			{children}
		</p>
	);
}

function Toggle({ id, checked, onChange }) {
	return (
		<label
			htmlFor={id}
			className="relative inline-flex items-center cursor-pointer"
		>
			<input
				id={id}
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className="sr-only"
			/>
			<div
				className="w-11 h-6 rounded-full transition-colors duration-200 relative"
				style={{
					backgroundColor: checked
						? "var(--color-primary)"
						: "var(--color-border)",
				}}
			>
				<span
					className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
					style={{
						transform: checked ? "translateX(20px)" : "translateX(0px)",
					}}
				/>
			</div>
		</label>
	);
}

export default function Profile() {
	const { user, logout, updateUser } = useAuth();
	const { t } = useLanguage();
	const isTutor = user?.role === "tutor";
	const [savingProfile, setSavingProfile] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [saveError, setSaveError] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [draft, setDraft] = useState(() => createInitialDraft(user));
	const fileInputRef = useRef(null);

	useEffect(() => {
		setDraft(createInitialDraft(user));
	}, [user]);

	const currentStreak = user?.currentStreak ?? 0;
	const bestStreak = user?.bestStreak ?? 0;
	const totalHours = Math.round((user?.totalMinutes ?? 0) / 60);
	const totalSessions = user?.totalSessions ?? 0;
	const selectedGoals = useMemo(() => toArray(draft.goals), [draft.goals]);
	const displayPronouns = draft.pronouns?.trim() || user?.pronouns?.trim();
	const initials = getUserInitials(user?.name);

	const getOptionLabel = (group, key) =>
		t(`profile.option_labels.${group}.${key}`);

	const setPreference = (path, value) => {
		setDraft((current) => {
			const next = structuredClone(current);
			const segments = path.split(".");
			let target = next;
			for (let i = 0; i < segments.length - 1; i += 1)
				target = target[segments[i]];
			target[segments[segments.length - 1]] = value;
			return next;
		});
	};

	const toggleArrayItem = (path, value) => {
		setDraft((current) => {
			const next = structuredClone(current);
			const segments = path.split(".");
			let target = next;
			for (let i = 0; i < segments.length - 1; i += 1)
				target = target[segments[i]];
			const key = segments[segments.length - 1];
			const values = Array.isArray(target[key]) ? target[key] : [];
			target[key] = values.includes(value)
				? values.filter((item) => item !== value)
				: [...values, value];
			return next;
		});
	};

	const handleSaveProfile = async () => {
		setSavingProfile(true);
		setSaveError(false);
		try {
			const payload = {
				name: draft.name,
				email: draft.email,
				pronouns: draft.pronouns,
				goals: draft.goals,
				preferences: {
					practiceIntensity: draft.preferences.practiceIntensity,
					sessionDuration: Number(draft.preferences.sessionDuration),
					timeOfDay: draft.preferences.timeOfDay,
					notifications: draft.preferences.notifications,
					language: draft.preferences.language,
					theme: draft.preferences.theme,
					...(isTutor
						? {
								lowStimMode: draft.preferences.lowStimMode,
								safetyAnchors: {
									phrase: draft.preferences.safetyAnchors.phrase,
									bodyCue: draft.preferences.safetyAnchors.bodyCue,
								},
							}
						: {}),
				},
			};
			const response = await updateProfile(payload);
			const updatedUser = response?.data?.data || response?.data;
			if (updatedUser) {
				updateUser(updatedUser);
				setDraft(createInitialDraft(updatedUser));
				setSaveSuccess(true);
				setTimeout(() => setSaveSuccess(false), 1800);
			}
		} catch {
			setSaveError(true);
			setTimeout(() => setSaveError(false), 3000);
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePhotoInputChange = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		setUploadingPhoto(true);
		try {
			const formData = new FormData();
			formData.append("profileImage", file);
			const response = await updateProfileImage(formData);
			const updatedUser = response?.data?.data || response?.data;
			if (updatedUser) updateUser(updatedUser);
		} finally {
			setUploadingPhoto(false);
			event.target.value = "";
		}
	};

	const handleDeleteAccount = async () => {
		setDeletingAccount(true);
		try {
			await deleteMyAccount();
			setDeleteModalOpen(false);
			await logout();
		} finally {
			setDeletingAccount(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 pt-4 pb-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handlePhotoInputChange}
				className="hidden"
			/>

			{/* ── HERO CARD ──────────────────────────────────────────────────── */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-[32px] p-6 sm:p-8 text-white overflow-hidden relative"
				style={{
					backgroundImage:
						"linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
					boxShadow: "var(--shadow-card-hover)",
				}}
			>
				<div
					className="absolute inset-0 opacity-15 pointer-events-none"
					style={{
						backgroundImage:
							"radial-gradient(circle at 20% 20%, white 0, transparent 30%), radial-gradient(circle at 80% 0%, white 0, transparent 22%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.65) 0, transparent 25%)",
					}}
				/>
				<div className="relative flex flex-col gap-6">
					{/* Identity row */}
					<div className="flex items-start gap-4 sm:gap-5">
						{/* Avatar — full button for better touch area */}
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="relative shrink-0 group rounded-[28px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
							title={t("profile.change_photo")}
							aria-label={t("profile.change_photo")}
						>
							<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-white/18 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.16)] relative">
								{user?.profileImageUrl ? (
									<img
										src={user.profileImageUrl}
										alt={user.name}
										className={`w-full h-full object-cover transition-opacity duration-200 ${uploadingPhoto ? "opacity-40" : ""}`}
									/>
								) : (
									<span className="text-3xl sm:text-4xl font-bold text-white select-none font-display">
										{initials}
									</span>
								)}
								{/* Hover overlay */}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 rounded-[28px] flex items-center justify-center">
									<Camera
										size={22}
										className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
									/>
								</div>
								{/* Upload spinner */}
								{uploadingPhoto ? (
									<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[28px]">
										<LoadingSpinner size={24} color="white" />
									</div>
								) : null}
							</div>
						</button>

						{/* Name + meta */}
						<div className="min-w-0 pt-1">
							<div className="flex flex-wrap items-center gap-2 mb-1.5">
								<h1
									className="text-3xl sm:text-4xl font-semibold leading-tight"
								>
									{user?.name || t("profile.title")}
								</h1>
								{displayPronouns ? (
									<span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/18 border border-white/20">
										{displayPronouns}
									</span>
								) : null}
							</div>
							<p className="text-white/80 text-sm font-medium break-all">
								{user?.email}
							</p>
						</div>
					</div>

					{/* Stats — always 4 items: 2×2 on mobile, 1×4 on sm+ */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
						{[
							{
								label: t("profile.current_streak"),
								value: currentStreak,
								unit: t("profile.days"),
							},
							{
								label: t("profile.best_streak"),
								value: bestStreak,
								unit: t("profile.days"),
							},
							{
								label: t("profile.total_hours"),
								value: totalHours,
								unit: "h",
							},
							{
								label: t("profile.sessions"),
								value: totalSessions,
								unit: "",
							},
						].map(({ label, value, unit }) => (
							<div
								key={label}
								className="rounded-2xl bg-white/14 border border-white/15 px-3 py-3 text-center"
							>
								<p className="text-[10px] sm:text-[11px] uppercase tracking-[0.13em] text-white/75 leading-tight">
									{label}
								</p>
								<p className="text-2xl font-bold mt-1 leading-none">
									{value}
									{unit ? (
										<span className="text-sm font-medium ml-0.5 opacity-80">
											{unit}
										</span>
									) : null}
								</p>
							</div>
						))}
					</div>
				</div>
			</motion.div>

			{/* ── MAIN GRID ──────────────────────────────────────────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 xl:gap-6 items-start">
				{/* LEFT COLUMN */}
				<div className="flex flex-col gap-5">
					{/* Account card */}
					<div
						className="rounded-3xl p-5 sm:p-6 space-y-5 shadow-[var(--shadow-card)]"
						style={cardStyle}
					>
						<SectionTitle>{t("profile.account_details")}</SectionTitle>
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.name")}
								</span>
								<input
									value={draft.name}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											name: event.target.value,
										}))
									}
									className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
									style={inputStyle}
								/>
							</label>
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									Email
								</span>
								<input
									value={draft.email}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											email: event.target.value,
										}))
									}
									className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
									style={inputStyle}
								/>
							</label>
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.pronouns")}
								</span>
								<input
									value={draft.pronouns}
									onChange={(event) =>
										setDraft((current) => ({
											...current,
											pronouns: event.target.value,
										}))
									}
									placeholder={t("profile.pronouns_placeholder")}
									className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
									style={inputStyle}
								/>
							</label>
						</div>

						{/* Goals */}
						<div>
							<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
								<p
									className="text-sm font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.goals_title")}
								</p>
								<span
									className="text-xs"
									style={{ color: "var(--color-text-muted)" }}
								>
									{t("profile.goals_hint")}
								</span>
							</div>
							<div className="flex flex-wrap gap-2">
								{GOAL_OPTIONS.map((goal) => {
									const active = selectedGoals.includes(goal);
									return (
										<button
											key={goal}
											type="button"
											onClick={() => toggleArrayItem("goals", goal)}
											className="px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150"
											style={{
												backgroundColor: active
													? "var(--color-primary)"
													: "var(--color-surface)",
												color: active ? "white" : "var(--color-text-secondary)",
												border: "1px solid var(--color-border)",
											}}
										>
											{getOptionLabel("goals", goal)}
										</button>
									);
								})}
							</div>
						</div>
					</div>

					{/* Practice preferences card */}
					<div
						className="rounded-3xl p-5 sm:p-6 space-y-5 shadow-[var(--shadow-card)]"
						style={cardStyle}
					>
						<SectionTitle>{t("profile.practice_preferences")}</SectionTitle>
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.intensity")}
								</span>
								<select
									value={draft.preferences.practiceIntensity}
									onChange={(event) =>
										setPreference(
											"preferences.practiceIntensity",
											event.target.value,
										)
									}
									className="w-full rounded-xl px-4 py-3 border outline-none"
									style={inputStyle}
								>
									{PRACTICE_INTENSITIES.map((item) => (
										<option key={item} value={item}>
											{getOptionLabel("practice_intensity", item)}
										</option>
									))}
								</select>
							</label>
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.session_duration")}
								</span>
								<input
									type="number"
									min="1"
									value={draft.preferences.sessionDuration}
									onChange={(event) =>
										setPreference(
											"preferences.sessionDuration",
											event.target.value,
										)
									}
									className="w-full rounded-xl px-4 py-3 border outline-none"
									style={inputStyle}
								/>
							</label>
							<label className="space-y-1.5 text-sm">
								<span
									className="font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{t("profile.time_of_day")}
								</span>
								<select
									value={draft.preferences.timeOfDay}
									onChange={(event) =>
										setPreference("preferences.timeOfDay", event.target.value)
									}
									className="w-full rounded-xl px-4 py-3 border outline-none"
									style={inputStyle}
								>
									{TIME_OF_DAY_OPTIONS.map((item) => (
										<option key={item} value={item}>
											{getOptionLabel("time_of_day", item)}
										</option>
									))}
								</select>
							</label>
						</div>

						{isTutor && (
							<div
								className="pt-4 border-t"
								style={{ borderColor: "var(--color-border-soft)" }}
							>
								<div className="flex items-center justify-between gap-4">
									<div>
										<p
											className="text-sm font-semibold"
											style={{ color: "var(--color-text-primary)" }}
										>
											{t("profile.low_stim_mode")}
										</p>
										<p
											className="text-xs mt-1"
											style={{ color: "var(--color-text-muted)" }}
										>
											{t("profile.low_stim_mode_hint")}
										</p>
									</div>
									<Toggle
										id="low-stim-mode"
										checked={draft.preferences.lowStimMode}
										onChange={(event) =>
											setPreference(
												"preferences.lowStimMode",
												event.target.checked,
											)
										}
									/>
								</div>
								<div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 mt-4">
									<label className="space-y-1.5 text-sm">
										<span
											className="font-semibold"
											style={{ color: "var(--color-text-primary)" }}
										>
											{t("profile.safety_anchor_phrase")}
										</span>
										<input
											value={draft.preferences.safetyAnchors.phrase}
											onChange={(event) =>
												setPreference(
													"preferences.safetyAnchors.phrase",
													event.target.value,
												)
											}
											placeholder={t(
												"profile.safety_anchor_phrase_placeholder",
											)}
											maxLength={120}
											className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
											style={inputStyle}
										/>
									</label>
									<label className="space-y-1.5 text-sm">
										<span
											className="font-semibold"
											style={{ color: "var(--color-text-primary)" }}
										>
											{t("profile.safety_anchor_body_cue")}
										</span>
										<input
											value={draft.preferences.safetyAnchors.bodyCue}
											onChange={(event) =>
												setPreference(
													"preferences.safetyAnchors.bodyCue",
													event.target.value,
												)
											}
											placeholder={t(
												"profile.safety_anchor_body_cue_placeholder",
											)}
											maxLength={120}
											className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
											style={inputStyle}
										/>
									</label>
								</div>
							</div>
						)}

						{/* Interface subsection */}
						<div
							className="pt-4 border-t space-y-3"
							style={{ borderColor: "var(--color-border)" }}
						>
							<SectionTitle>{t("profile.interface_title")}</SectionTitle>
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
								<label className="space-y-1.5 text-sm">
									<span
										className="font-semibold"
										style={{ color: "var(--color-text-primary)" }}
									>
										{t("profile.language")}
									</span>
									<select
										value={draft.preferences.language}
										onChange={(event) =>
											setPreference("preferences.language", event.target.value)
										}
										className="w-full rounded-xl px-4 py-3 border outline-none"
										style={inputStyle}
									>
										<option value="es">Español</option>
										<option value="en">English</option>
									</select>
								</label>
								<label className="space-y-1.5 text-sm">
									<span
										className="font-semibold"
										style={{ color: "var(--color-text-primary)" }}
									>
										{t("profile.theme")}
									</span>
									<select
										value={draft.preferences.theme}
										onChange={(event) =>
											setPreference("preferences.theme", event.target.value)
										}
										className="w-full rounded-xl px-4 py-3 border outline-none"
										style={inputStyle}
									>
										<option value="light">
											{t("profile.option_labels.theme.light")}
										</option>
										<option value="dark">
											{t("profile.option_labels.theme.dark")}
										</option>
									</select>
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN — sticky */}
				<div className="flex flex-col gap-4 lg:sticky lg:top-4 self-start">
					<div
						className="rounded-3xl p-5 space-y-3 shadow-[var(--shadow-card)]"
						style={cardStyle}
					>
						<SectionTitle>{t("profile.actions_title")}</SectionTitle>

						{saveError && (
							<div
								className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
								style={{
									backgroundColor: "var(--color-warning-bg)",
									border: "1px solid var(--color-warning-border)",
									color: "var(--color-text-primary)",
								}}
							>
								{t("profile.save_error")}
							</div>
						)}

						{/* Save — primary CTA */}
						<Button
							variant="primary"
							onClick={handleSaveProfile}
							disabled={savingProfile || saveSuccess}
							className="w-full transition-colors duration-300"
							style={
								saveSuccess
									? {
											backgroundColor: "var(--color-success)",
											boxShadow: "none",
										}
									: {}
							}
						>
							{savingProfile
								? t("profile.saving_changes")
								: saveSuccess
									? t("profile.saved")
									: t("profile.save_changes")}
						</Button>

						{/* Logout — ghost, neutral */}
						<Button
							variant="ghost"
							onClick={logout}
							className="flex items-center justify-center gap-2 w-full"
							style={{ color: "var(--color-text-secondary)" }}
						>
							<LogOut size={16} />
							{t("profile.logout")}
						</Button>

						{/* Separator + destructive delete */}
						<div
							className="pt-4 mt-1 border-t"
							style={{ borderColor: "var(--color-border)" }}
						>
							<button
								type="button"
								onClick={() => setDeleteModalOpen(true)}
								className="w-full text-sm py-1.5 transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
								style={{
									color: "var(--color-danger)",
									outlineColor: "var(--color-danger)",
								}}
							>
								{t("profile.delete_account")}
							</button>
						</div>
					</div>
				</div>
			</div>

			<ConfirmModal
				open={deleteModalOpen}
				onClose={() => (deletingAccount ? null : setDeleteModalOpen(false))}
				onConfirm={handleDeleteAccount}
				title={t("profile.delete_modal_title")}
				description={t("profile.delete_modal_description")}
				confirmLabel={t("profile.delete_confirm")}
				cancelLabel={t("ui.cancel")}
				danger
				loading={deletingAccount}
				confirmPhrase={t("profile.delete_confirm_phrase")}
			/>
		</div>
	);
}

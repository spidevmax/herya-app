import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
	deleteMyAccount,
	updateProfile,
	updateProfileImage,
} from "@/api/users.api";
import { ConfirmModal } from "@/components/ui";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";
import AccountDetailsCard from "@/components/profile/AccountDetailsCard";
import PracticePreferencesCard from "@/components/profile/PracticePreferencesCard";
import ProfileActions from "@/components/profile/ProfileActions";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
];

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

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validateDraft(draft, t) {
	const errors = {};
	const name = draft.name.trim();
	if (name.length < 2 || name.length > 50) {
		errors.name = t("profile.validation.name_length");
	}
	if (!EMAIL_RE.test(draft.email.trim())) {
		errors.email = t("profile.validation.email_invalid");
	}
	const duration = Number(draft.preferences.sessionDuration);
	if (!Number.isFinite(duration) || duration < 1) {
		errors.sessionDuration = t("profile.validation.duration_positive");
	}
	return errors;
}

function draftsAreEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

export default function Profile() {
	const { user, logout, updateUser } = useAuth();
	const { t } = useLanguage();
	const isTutor = user?.role === "tutor";
	const [savingProfile, setSavingProfile] = useState(false);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [saveError, setSaveError] = useState("");
	const [photoError, setPhotoError] = useState("");
	const [fieldErrors, setFieldErrors] = useState({});
	const [deletingAccount, setDeletingAccount] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [draft, setDraft] = useState(() => createInitialDraft(user));
	const [baseDraft, setBaseDraft] = useState(() => createInitialDraft(user));
	const fileInputRef = useRef(null);

	useEffect(() => {
		const next = createInitialDraft(user);
		setDraft(next);
		setBaseDraft(next);
	}, [user]);

	const isDirty = useMemo(
		() => !draftsAreEqual(draft, baseDraft),
		[draft, baseDraft],
	);

	const selectedGoals = useMemo(() => toArray(draft.goals), [draft.goals]);
	const displayPronouns = draft.pronouns?.trim() || user?.pronouns?.trim();

	const setPreference = useCallback((path, value) => {
		setDraft((current) => {
			const next = structuredClone(current);
			const segments = path.split(".");
			let target = next;
			for (let i = 0; i < segments.length - 1; i += 1)
				target = target[segments[i]];
			target[segments[segments.length - 1]] = value;
			return next;
		});
	}, []);

	const toggleArrayItem = useCallback((path, value) => {
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
	}, []);

	const handleSaveProfile = async () => {
		setFieldErrors({});
		setSaveError("");

		const errors = validateDraft(draft, t);
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}

		setSavingProfile(true);
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
				const next = createInitialDraft(updatedUser);
				setDraft(next);
				setBaseDraft(next);
				setSaveSuccess(true);
				setTimeout(() => setSaveSuccess(false), 1800);
			}
		} catch (err) {
			const serverErrors = err.response?.data?.errors;
			if (Array.isArray(serverErrors)) {
				const mapped = {};
				for (const { field, message } of serverErrors) {
					const short = field?.split(".").pop();
					if (short) mapped[short] = message;
				}
				if (Object.keys(mapped).length > 0) {
					setFieldErrors(mapped);
				}
			}
			setSaveError(
				err.response?.data?.message || t("profile.save_error"),
			);
			setTimeout(() => setSaveError(""), 3000);
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePhotoInputChange = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setPhotoError("");

		if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
			setPhotoError(t("profile.photo_invalid_type"));
			event.target.value = "";
			return;
		}
		if (file.size > MAX_PHOTO_SIZE) {
			setPhotoError(t("profile.photo_too_large"));
			event.target.value = "";
			return;
		}

		setUploadingPhoto(true);
		try {
			const formData = new FormData();
			formData.append("profileImage", file);
			const response = await updateProfileImage(formData);
			const updatedUser = response?.data?.data || response?.data;
			if (updatedUser) updateUser(updatedUser);
		} catch {
			setPhotoError(t("profile.photo_upload_error"));
			setTimeout(() => setPhotoError(""), 3000);
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
		<main className="flex flex-col gap-6 pt-4 pb-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png,image/gif,image/webp"
				onChange={handlePhotoInputChange}
				className="hidden"
			/>

			{/* Photo error alert */}
			{photoError && (
				<div
					role="alert"
					aria-live="assertive"
					className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
						color: "var(--color-text-primary)",
					}}
				>
					{photoError}
				</div>
			)}

			<ProfileHeroCard
				user={user}
				displayPronouns={displayPronouns}
				uploadingPhoto={uploadingPhoto}
				onAvatarClick={() => fileInputRef.current?.click()}
			/>

			{/* Main grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 xl:gap-6 items-start">
				{/* Left column */}
				<div className="flex flex-col gap-5">
					<AccountDetailsCard
						draft={draft}
						setDraft={setDraft}
						selectedGoals={selectedGoals}
						toggleArrayItem={toggleArrayItem}
						fieldErrors={fieldErrors}
					/>
					<PracticePreferencesCard
						draft={draft}
						isTutor={isTutor}
						setPreference={setPreference}
						fieldErrors={fieldErrors}
					/>
				</div>

				{/* Right column — sticky */}
				<div className="flex flex-col gap-4 lg:sticky lg:top-4 self-start">
					<ProfileActions
						user={user}
						savingProfile={savingProfile}
						saveSuccess={saveSuccess}
						saveError={saveError}
						isDirty={isDirty}
						onSave={handleSaveProfile}
						onLogout={logout}
						onDeleteClick={() => setDeleteModalOpen(true)}
					/>
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
		</main>
	);
}

import SectionTitle from "./SectionTitle";
import Toggle from "./Toggle";
import { useLanguage } from "@/context/LanguageContext";

const PRACTICE_INTENSITIES = ["gentle", "moderate", "vigorous"];
const TIME_OF_DAY_OPTIONS = ["morning", "afternoon", "evening", "anytime"];

const cardStyle = { backgroundColor: "var(--color-surface-card)" };
const inputStyle = {
	backgroundColor: "var(--color-surface)",
	borderColor: "var(--color-border)",
	color: "var(--color-text-primary)",
};

export default function PracticePreferencesCard({
	draft,
	isTutor,
	setPreference,
	fieldErrors,
}) {
	const { t } = useLanguage();

	const getOptionLabel = (group, key) =>
		t(`profile.option_labels.${group}.${key}`);

	const fieldErrorStyle = (field) =>
		fieldErrors[field]
			? { ...inputStyle, borderColor: "var(--color-danger)" }
			: inputStyle;

	return (
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
								Number(event.target.value) || 0,
							)
						}
						className="w-full rounded-xl px-4 py-3 border outline-none"
						style={fieldErrorStyle("sessionDuration")}
					/>
					{fieldErrors.sessionDuration && (
						<p
							role="alert"
							className="text-xs mt-0.5"
							style={{ color: "var(--color-danger)" }}
						>
							{fieldErrors.sessionDuration}
						</p>
					)}
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
							label={t("profile.low_stim_mode")}
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
	);
}

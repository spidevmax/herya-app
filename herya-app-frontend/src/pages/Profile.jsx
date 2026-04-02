import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Clock, Edit, Flame, LogOut } from "lucide-react";
import { updateProfile } from "@/api/users.api";
import { Button } from "@/components/ui";
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
const NOTIFICATION_FREQUENCIES = ["daily", "weekly", "never"];

const toArray = (value) => (Array.isArray(value) ? value : []);
const normalizeTime = (value) => {
	if (typeof value !== "string" || !value) return "09:00";
	return value.slice(0, 5);
};

const createInitialDraft = (user) => ({
	name: user?.name ?? "",
	email: user?.email ?? "",
	goals: toArray(user?.goals),
	preferences: {
		practiceIntensity: user?.preferences?.practiceIntensity ?? "moderate",
		sessionDuration: user?.preferences?.sessionDuration ?? 30,
		timeOfDay: user?.preferences?.timeOfDay ?? "anytime",
		notifications: {
			enabled: user?.preferences?.notifications?.enabled ?? true,
			frequency: user?.preferences?.notifications?.frequency ?? "weekly",
			reminderTime: normalizeTime(
				user?.preferences?.notifications?.reminderTime,
			),
		},
		language: user?.preferences?.language ?? "en",
		theme: user?.preferences?.theme ?? "light",
	},
});

const cardStyle = { backgroundColor: "var(--color-surface-card)" };
const inputStyle = {
	backgroundColor: "var(--color-surface)",
	borderColor: "var(--color-border)",
	color: "var(--color-text-primary)",
};

const StatCard = ({ icon, label, value, color = "var(--color-primary)" }) => (
	<div
		className="rounded-2xl p-4 flex flex-col items-center gap-1 text-center"
		style={cardStyle}
	>
		<div
			className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
			style={{ backgroundColor: `${color}20` }}
		>
			<span style={{ color }}>{icon}</span>
		</div>
		<p
			className="font-bold text-xl"
			style={{ color: "var(--color-text-primary)" }}
		>
			{value}
		</p>
		<p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
			{label}
		</p>
	</div>
);

export default function Profile() {
	const { user, logout, updateUser } = useAuth();
	const { t, setLanguage } = useLanguage();
	const [savingProfile, setSavingProfile] = useState(false);
	const [draft, setDraft] = useState(() => createInitialDraft(user));
	const languageRequestId = useRef(0);

	useEffect(() => {
		setDraft(createInitialDraft(user));
	}, [user]);

	const currentStreak = user?.currentStreak ?? 0;
	const totalHours = Math.round((user?.totalMinutes ?? 0) / 60);
	const totalSessions = user?.totalSessions ?? 0;
	const selectedGoals = useMemo(() => toArray(draft.goals), [draft.goals]);

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

	const handleLanguageChange = async (newLang) => {
		const requestId = ++languageRequestId.current;
		setLanguage(newLang);
		setPreference("preferences.language", newLang);
		const response = await updateProfile({
			preferences: { language: newLang },
		});
		const updatedUser = response?.data?.data || response?.data;
		if (updatedUser && requestId === languageRequestId.current)
			updateUser(updatedUser);
	};

	const handleSaveProfile = async () => {
		setSavingProfile(true);
		try {
			const payload = {
				name: draft.name,
				email: draft.email,
				goals: draft.goals,
				preferences: {
					practiceIntensity: draft.preferences.practiceIntensity,
					sessionDuration: Number(draft.preferences.sessionDuration),
					timeOfDay: draft.preferences.timeOfDay,
					notifications: draft.preferences.notifications,
					language: draft.preferences.language,
					theme: draft.preferences.theme,
				},
			};
			const response = await updateProfile(payload);
			const updatedUser = response?.data?.data || response?.data;
			if (updatedUser) {
				updateUser(updatedUser);
				setDraft(createInitialDraft(updatedUser));
			}
		} finally {
			setSavingProfile(false);
		}
	};

	return (
		<div className="flex flex-col gap-5 pt-4 pb-6 px-4">
			<div className="flex items-center justify-between">
				<h1
					className="text-2xl font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("profile.title")}
				</h1>
				<button
					type="button"
					className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{
						backgroundColor: "var(--color-surface-card)",
						color: "var(--color-text-muted)",
					}}
				>
					<Edit size={18} />
				</button>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-3xl p-6 text-white"
				style={{
					backgroundImage:
						"linear-gradient(to right, var(--color-primary), var(--color-secondary))",
				}}
			>
				<div className="flex items-center gap-4 mb-5">
					<div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl">
						{user?.avatar ? (
							<img
								src={user.avatar}
								alt={user.name}
								className="w-full h-full rounded-2xl object-cover"
							/>
						) : (
							"🧘"
						)}
					</div>
					<div>
						<h2 className="text-xl font-semibold">{user?.name}</h2>
						<p className="text-white/70 text-sm font-medium">{user?.email}</p>
					</div>
				</div>
			</motion.div>

			<div className="rounded-3xl p-5 space-y-4" style={cardStyle}>
				<h2
					className="text-base font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("profile.account_details")}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label className="space-y-1 text-sm">
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
					<label className="space-y-1 text-sm">
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
				</div>
				<div>
					<p
						className="text-sm font-semibold mb-2"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("profile.goals_title")}
					</p>
					<div className="flex flex-wrap gap-2">
						{GOAL_OPTIONS.map((goal) => {
							const active = selectedGoals.includes(goal);
							return (
								<button
									key={goal}
									type="button"
									onClick={() => toggleArrayItem("goals", goal)}
									className="px-3 py-2 rounded-full text-xs font-semibold"
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

			<div className="rounded-3xl p-5 space-y-4" style={cardStyle}>
				<h2
					className="text-base font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("profile.practice_preferences")}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label className="space-y-1 text-sm">
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
					<label className="space-y-1 text-sm">
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
								setPreference("preferences.sessionDuration", event.target.value)
							}
							className="w-full rounded-xl px-4 py-3 border outline-none"
							style={inputStyle}
						/>
					</label>
					<label className="space-y-1 text-sm">
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
					<label className="space-y-1 text-sm">
						<span
							className="font-semibold"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("profile.language")}
						</span>
						<select
							value={draft.preferences.language}
							onChange={(event) => handleLanguageChange(event.target.value)}
							className="w-full rounded-xl px-4 py-3 border outline-none"
							style={inputStyle}
						>
							<option value="es">Español</option>
							<option value="en">English</option>
						</select>
					</label>
					<label className="space-y-1 text-sm">
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

			<div className="rounded-3xl p-5 space-y-4" style={cardStyle}>
				<h2
					className="text-base font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{t("profile.interface_notifications")}
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label
						className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border"
						style={{ borderColor: "var(--color-border)" }}
					>
						<div>
							<p
								className="text-sm font-semibold"
								style={{ color: "var(--color-text-primary)" }}
							>
								{t("profile.notifications_enabled")}
							</p>
						</div>
						<input
							type="checkbox"
							checked={draft.preferences.notifications.enabled}
							onChange={(event) =>
								setPreference(
									"preferences.notifications.enabled",
									event.target.checked,
								)
							}
						/>
					</label>
					<label className="space-y-1 text-sm">
						<span
							className="font-semibold"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("profile.frequency")}
						</span>
						<select
							value={draft.preferences.notifications.frequency}
							onChange={(event) =>
								setPreference(
									"preferences.notifications.frequency",
									event.target.value,
								)
							}
							className="w-full rounded-xl px-4 py-3 border outline-none"
							style={inputStyle}
						>
							{NOTIFICATION_FREQUENCIES.map((item) => (
								<option key={item} value={item}>
									{getOptionLabel("notifications_frequency", item)}
								</option>
							))}
						</select>
					</label>
					<label className="space-y-1 text-sm">
						<span
							className="font-semibold"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("profile.reminder_time")}
						</span>
						<input
							type="time"
							value={draft.preferences.notifications.reminderTime}
							onChange={(event) =>
								setPreference(
									"preferences.notifications.reminderTime",
									event.target.value,
								)
							}
							className="w-full rounded-xl px-4 py-3 border outline-none"
							style={inputStyle}
						/>
					</label>
				</div>
			</div>

			<Button
				variant="outline"
				onClick={handleSaveProfile}
				disabled={savingProfile}
				className="flex items-center justify-center gap-2 w-full"
				style={{
					color: "var(--color-primary)",
					borderColor: "var(--color-primary)30",
				}}
			>
				{savingProfile
					? t("profile.saving_changes")
					: t("profile.save_changes")}
			</Button>

			<div className="grid grid-cols-3 gap-3">
				<StatCard
					icon={<Flame size={20} />}
					label={t("profile.current_streak")}
					value={currentStreak}
					color="#FFB347"
				/>
				<StatCard
					icon={<Clock size={20} />}
					label={t("profile.total_hours")}
					value={totalHours}
					color="#4A72FF"
				/>
				<StatCard
					icon={<BookOpen size={20} />}
					label={t("profile.sessions")}
					value={totalSessions}
					color="#5DB075"
				/>
			</div>

			<Button
				variant="outline"
				onClick={logout}
				className="flex items-center justify-center gap-2 w-full"
				style={{
					color: "var(--color-danger)",
					borderColor: "var(--color-danger)30",
				}}
			>
				<LogOut size={16} /> {t("profile.logout")}
			</Button>

			<div className="flex justify-center">
				<div
					className="flex items-center gap-2 px-4 py-2 rounded-2xl"
					style={cardStyle}
				>
					<Award size={16} style={{ color: "#9B5DE5" }} />
					<span
						className="text-xs font-semibold"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{t("profile.best_streak")}: {user?.bestStreak ?? 0}
					</span>
				</div>
			</div>
		</div>
	);
}

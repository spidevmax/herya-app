import { useState } from "react";
import { motion } from "framer-motion";
import { Award, BookOpen, Clock, Edit, Flame, Globe, LogOut, Moon, Sun } from "lucide-react";
import { updateProfile } from "@/api/users.api";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

function StatCard({ icon, label, value, color = "var(--color-primary)" }) {
	return (
		<div
			className="rounded-2xl p-4 flex flex-col items-center gap-1 text-center"
			style={{ backgroundColor: "var(--color-surface-card)" }}
		>
			<div
				className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
				style={{ backgroundColor: `${color}20` }}
			>
				<span style={{ color }}>{icon}</span>
			</div>
			<p className="font-bold text-xl" style={{ color: "var(--color-text-primary)" }}>
				{value}
			</p>
			<p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
				{label}
			</p>
		</div>
	);
}

function SettingRow({ icon, label, hint, children }) {
	return (
		<div
			className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
			style={{ backgroundColor: "var(--color-surface-card)" }}
		>
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<span style={{ color: "var(--color-primary)" }}>{icon}</span>
				<div className="min-w-0">
					<p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
						{label}
					</p>
					{hint && (
						<p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
							{hint}
						</p>
					)}
				</div>
			</div>
			<div className="flex-shrink-0">{children}</div>
		</div>
	);
}

export default function Profile() {
	const { user, logout, refreshUser } = useAuth();
	const { t, lang, setLanguage } = useLanguage();
	const { isDark, toggleTheme } = useTheme();
	const [savingLang, setSavingLang] = useState(false);
	const [savingTheme, setSavingTheme] = useState(false);

	const level = user?.level ?? 1;
	const xp = user?.experiencePoints ?? 0;
	const xpToNext = level * 100;
	const progress = Math.min((xp % xpToNext) / xpToNext, 1);

	// Stats from user object (populated by backend on login/refresh)
	const currentStreak = user?.currentStreak ?? 0;
	const totalHours = Math.round((user?.totalMinutes ?? 0) / 60);
	const totalSessions = user?.totalSessions ?? 0;

	const handleLanguageChange = async (newLang) => {
		setLanguage(newLang);
		setSavingLang(true);
		try {
			await updateProfile({ preferences: { language: newLang } });
			await refreshUser();
		} catch {
			// localStorage already updated, backend sync is best-effort
		} finally {
			setSavingLang(false);
		}
	};

	const handleThemeToggle = async () => {
		const newTheme = isDark ? "light" : "dark";
		toggleTheme();
		setSavingTheme(true);
		try {
			await updateProfile({ preferences: { theme: newTheme } });
		} catch {
			// best-effort
		} finally {
			setSavingTheme(false);
		}
	};

	return (
		<div className="flex flex-col gap-5 pt-4 pb-6 px-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1
					className="text-2xl font-semibold"
					style={{ fontFamily: '"DM Sans", sans-serif', color: "var(--color-text-primary)" }}
				>
					{t("profile.title")}
				</h1>
				<button
					type="button"
					className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
					style={{ backgroundColor: "var(--color-surface-card)", color: "var(--color-text-muted)" }}
				>
					<Edit size={18} />
				</button>
			</div>

			{/* Profile card */}
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-3xl p-6 text-white"
				style={{
					backgroundImage: "linear-gradient(to right, var(--color-primary), var(--color-secondary))",
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
						<h2 className="text-xl font-semibold" style={{ fontFamily: '"DM Sans", sans-serif' }}>
							{user?.name}
						</h2>
						<p className="text-white/70 text-sm font-medium" style={{ fontFamily: '"DM Sans", sans-serif' }}>
							{user?.email}
						</p>
						<span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs font-medium">
							{t("profile.level")} {level}
						</span>
					</div>
				</div>
				<div className="flex items-center justify-between text-white/80 text-xs font-medium mb-1.5">
					<span>{xp} XP</span>
					<span>{xpToNext} XP</span>
				</div>
				<div className="h-2 bg-white/20 rounded-full overflow-hidden">
					<motion.div
						initial={{ width: 0 }}
						animate={{ width: `${progress * 100}%` }}
						transition={{ duration: 1, delay: 0.3 }}
						className="h-full bg-white rounded-full"
					/>
				</div>
			</motion.div>

			{/* Stats */}
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

			{/* Settings */}
			<div className="flex flex-col gap-2">
				{/* Language */}
				<SettingRow
					icon={<Globe size={18} />}
					label={t("profile.language")}
					hint={t("profile.language_hint")}
				>
					<div
						className="flex rounded-xl overflow-hidden border"
						style={{ borderColor: "var(--color-border)" }}
					>
						{["es", "en"].map((l) => (
							<button
								key={l}
								type="button"
								disabled={savingLang}
								onClick={() => handleLanguageChange(l)}
								className="px-3 py-1.5 text-xs font-bold transition-all"
								style={{
									backgroundColor:
										lang === l ? "var(--color-primary)" : "var(--color-surface-card)",
									color: lang === l ? "white" : "var(--color-text-muted)",
									fontFamily: '"DM Sans", sans-serif',
								}}
							>
								{l.toUpperCase()}
							</button>
						))}
					</div>
				</SettingRow>

				{/* Theme */}
				<SettingRow
					icon={isDark ? <Moon size={18} /> : <Sun size={18} />}
					label={isDark ? "Dark mode" : "Light mode"}
					hint={isDark ? "Switch to light theme" : "Switch to dark theme"}
				>
					<button
						type="button"
						disabled={savingTheme}
						onClick={handleThemeToggle}
						className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
						style={{
							backgroundColor: isDark ? "var(--color-primary)" : "var(--color-border)",
						}}
					>
						<span
							className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
							style={{ transform: isDark ? "translateX(24px)" : "translateX(0)" }}
						/>
					</button>
				</SettingRow>
			</div>

			{/* Sign out */}
			<Button
				variant="outline"
				onClick={logout}
				className="flex items-center justify-center gap-2 w-full"
				style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)30" }}
			>
				<LogOut size={16} /> {t("profile.logout")}
			</Button>

			{/* Best streak badge */}
			<div className="flex justify-center">
				<div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
					style={{ backgroundColor: "var(--color-surface-card)" }}
				>
					<Award size={16} style={{ color: "#9B5DE5" }} />
					<span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
						{t("profile.best_streak")}: {user?.bestStreak ?? 0}
					</span>
				</div>
			</div>
		</div>
	);
}

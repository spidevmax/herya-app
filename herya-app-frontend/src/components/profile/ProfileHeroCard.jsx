import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { LoadingSpinner } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

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

export default function ProfileHeroCard({
	user,
	displayPronouns,
	uploadingPhoto,
	onAvatarClick,
}) {
	const { t } = useLanguage();
	const initials = getUserInitials(user?.name);
	const currentStreak = user?.currentStreak ?? 0;
	const bestStreak = user?.bestStreak ?? 0;
	const totalHours = Math.round((user?.totalMinutes ?? 0) / 60);
	const totalSessions = user?.totalSessions ?? 0;

	return (
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
					<button
						type="button"
						onClick={onAvatarClick}
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
							<div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 rounded-[28px] flex items-center justify-center">
								<Camera
									size={22}
									className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
								/>
							</div>
							{uploadingPhoto ? (
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[28px]">
									<LoadingSpinner size={24} color="white" />
								</div>
							) : null}
						</div>
					</button>

					<div className="min-w-0 pt-1">
						<div className="flex flex-wrap items-center gap-2 mb-1.5">
							<h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
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

				{/* Stats grid */}
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
	);
}

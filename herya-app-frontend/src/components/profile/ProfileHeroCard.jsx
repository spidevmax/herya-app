import { AnimatePresence, motion } from "framer-motion";
import { Camera, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const getUserInitials = (name) => {
	if (!name?.trim()) return "?";
	return name
		.trim()
		.split(/\s+/)
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
};

const ProfileHeroCard = ({
	user,
	displayPronouns,
	uploadingPhoto,
	onUploadClick,
	onRemoveClick,
	hideStats = false,
}) => {
	const { t } = useLanguage();
	const initials = getUserInitials(user?.name);
	const currentStreak = user?.currentStreak ?? 0;
	const bestStreak = user?.bestStreak ?? 0;
	const totalHours = Math.round((user?.totalMinutes ?? 0) / 60);
	const totalSessions = user?.totalSessions ?? 0;
	const hasPhoto = Boolean(user?.profileImageUrl);

	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef(null);
	const buttonRef = useRef(null);

	useEffect(() => {
		if (!menuOpen) return undefined;
		const handlePointer = (event) => {
			if (
				menuRef.current?.contains(event.target) ||
				buttonRef.current?.contains(event.target)
			)
				return;
			setMenuOpen(false);
		};
		const handleKey = (event) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		document.addEventListener("mousedown", handlePointer);
		document.addEventListener("keydown", handleKey);
		return () => {
			document.removeEventListener("mousedown", handlePointer);
			document.removeEventListener("keydown", handleKey);
		};
	}, [menuOpen]);

	const handleAvatarClick = () => {
		if (uploadingPhoto) return;
		if (hasPhoto) {
			setMenuOpen((open) => !open);
		} else {
			onUploadClick();
		}
	};

	const handleUpload = () => {
		setMenuOpen(false);
		onUploadClick();
	};

	const handleRemove = () => {
		setMenuOpen(false);
		onRemoveClick();
	};

	return (
		<motion.section
			aria-label={user?.name || t("profile.title")}
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			className="ink-block relative p-6 sm:p-8"
			style={{ background: "var(--chandra)", color: "var(--on-fill)" }}
		>
			<div
				className="pointer-events-none absolute inset-0 overflow-hidden"
				style={{}}
			/>
			<div className="relative flex flex-col gap-6">
				{/* Identity row */}
				<div className="flex items-start gap-4 sm:gap-5">
					<div className="relative shrink-0">
						<button
							ref={buttonRef}
							type="button"
							onClick={handleAvatarClick}
							disabled={uploadingPhoto}
							aria-haspopup={hasPhoto ? "menu" : undefined}
							aria-expanded={hasPhoto ? menuOpen : undefined}
							className="relative shrink-0 group rounded-[28px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-wait"
							title={
								hasPhoto
									? t("profile.photo_actions_title")
									: t("profile.change_photo")
							}
							aria-label={
								hasPhoto
									? t("profile.photo_actions_title")
									: t("profile.change_photo")
							}
						>
							<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-white/18 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/20  relative">
								{hasPhoto ? (
									<img
										src={user.profileImageUrl}
										alt={user.name}
										className={`w-full h-full object-cover transition-opacity duration-200 ${uploadingPhoto ? "opacity-40" : ""}`}
									/>
								) : (
									<span className="text-3xl sm:text-4xl font-bold text-[var(--on-fill)] select-none font-display">
										{initials}
									</span>
								)}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 rounded-[28px] flex items-center justify-center">
									<Camera
										size={22}
										className="text-[var(--on-fill)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
										aria-hidden="true"
									/>
								</div>
								{uploadingPhoto ? (
									<div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[28px]">
										<LoadingSpinner size={24} color="white" />
									</div>
								) : null}
							</div>
						</button>

						<AnimatePresence>
							{menuOpen && hasPhoto ? (
								<motion.div
									ref={menuRef}
									role="menu"
									aria-label={t("profile.photo_actions_title")}
									initial={{ opacity: 0, y: -6, scale: 0.96 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: -6, scale: 0.96 }}
									transition={{ duration: 0.15 }}
									className="ink-block absolute left-0 top-full z-20 mt-2 w-56 p-1.5"
									style={{
										backgroundColor: "var(--paper-raised)",
										border: "var(--ink-width) solid var(--ink)",
									}}
								>
									<button
										type="button"
										role="menuitem"
										onClick={handleUpload}
										className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--paper)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chandra)]"
										style={{ color: "var(--ink)" }}
									>
										<Upload size={16} aria-hidden="true" />
										{t("profile.photo_actions_upload")}
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={handleRemove}
										className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors hover:bg-[color-mix(in_srgb,var(--alert)_8%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alert)]"
										style={{ color: "var(--alert)" }}
									>
										<Trash2 size={16} aria-hidden="true" />
										{t("profile.photo_actions_remove")}
									</button>
									<button
										type="button"
										role="menuitem"
										onClick={() => setMenuOpen(false)}
										className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors hover:bg-[var(--paper)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--chandra)]"
										style={{ color: "var(--ink-soft)" }}
									>
										<X size={16} aria-hidden="true" />
										{t("profile.photo_actions_cancel")}
									</button>
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>

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
						<p className="opacity-80 text-sm font-medium break-all">
							{user?.email}
						</p>
					</div>
				</div>

				{/* Stats grid */}
				{!hideStats && (
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
								className="rounded-[var(--radius-block)] border-[length:var(--ink-width)] border-[var(--on-fill)] px-3 py-3 text-center"
							>
								<p className="text-[10px] sm:text-[11px] opacity-75 leading-tight">
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
				)}
			</div>
		</motion.section>
	);
};

export default ProfileHeroCard;

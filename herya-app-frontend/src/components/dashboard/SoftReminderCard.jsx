import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const getDismissKey = () => {
	const today = new Date().toISOString().slice(0, 10);
	return `herya_dashboard_reminder_dismissed_${today}`;
};

const SoftReminderCard = ({ user, sessions = [], streak = 0 }) => {
	const { t } = useLanguage();
	const [isVisible, setIsVisible] = useState(() => {
		try {
			return localStorage.getItem(getDismissKey()) !== "1";
		} catch {
			return true;
		}
	});

	useEffect(() => {
		try {
			if (localStorage.getItem(getDismissKey()) === "1") {
				setIsVisible(false);
			}
		} catch {
			// Ignore storage access issues.
		}
	}, []);

	const reminder = useMemo(() => {
		const hour = new Date().getHours();
		const hasSessions = sessions.length > 0;
		const timeOfDay = user?.preferences?.timeOfDay;

		if (!hasSessions) {
			return {
				icon: Sparkles,
				message: t("dashboard.reminder_short_practice"),
				accent: "var(--chandra)",
			};
		}

		if (streak >= 3) {
			return {
				icon: Sparkles,
				message: t("dashboard.reminder_keep_going"),
				accent: "var(--surya)",
			};
		}

		if (timeOfDay === "morning" || hour < 12) {
			return {
				icon: Droplets,
				message: t("dashboard.reminder_water"),
				accent: "var(--chandra)",
			};
		}

		if (timeOfDay === "evening" || hour >= 17) {
			return {
				icon: Sparkles,
				message: t("dashboard.reminder_breathe"),
				accent: "var(--surya)",
			};
		}

		return {
			icon: Droplets,
			message: t("dashboard.reminder_water"),
			accent: "var(--chandra)",
		};
	}, [sessions.length, streak, t, user?.preferences?.timeOfDay]);

	const handleDismiss = () => {
		setIsVisible(false);
		try {
			localStorage.setItem(getDismissKey(), "1");
		} catch {
			// Ignore storage access issues.
		}
	};

	if (!isVisible) return null;

	const Icon = reminder.icon;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: -8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				className=""
			>
				<aside
					data-identity="next"
					aria-label={t("dashboard.reminder_label")}
					className="ink-block p-4"
					style={{ background: reminder.accent, color: "var(--on-fill)" }}
				>
					<div className="flex items-start gap-3">
						<div
							className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
							style={{
								background: "var(--paper-raised)",
								border: "var(--ink-width) solid var(--on-fill)",
								borderRadius: "var(--radius-block)",
							}}
						>
							<Icon
								size={18}
								aria-hidden="true"
								style={{ color: "var(--ink)" }}
							/>
						</div>

						<div className="flex-1 min-w-0">
							<p
								className="mb-1 text-[11px] font-bold"
								style={{ opacity: 0.75 }}
							>
								{t("dashboard.reminder_label")}
							</p>
							<p className="text-sm font-bold leading-6">{reminder.message}</p>
						</div>

						<button
							type="button"
							onClick={handleDismiss}
							className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:bg-black/5"
							aria-label={t("dashboard.dismiss_reminder")}
						>
							<X size={14} style={{ color: "var(--ink-soft)" }} />
						</button>
					</div>
				</aside>
			</motion.div>
		</AnimatePresence>
	);
};

export default SoftReminderCard;

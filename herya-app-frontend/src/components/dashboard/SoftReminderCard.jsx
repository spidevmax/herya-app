import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const getDismissKey = () => {
	const today = new Date().toISOString().slice(0, 10);
	return `herya_dashboard_reminder_dismissed_${today}`;
};

export default function SoftReminderCard({ user, sessions = [], streak = 0 }) {
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
				accent: "var(--color-primary)",
				bg: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, transparent), color-mix(in srgb, var(--color-secondary) 12%, transparent))",
			};
		}

		if (streak >= 3) {
			return {
				icon: Sparkles,
				message: t("dashboard.reminder_keep_going"),
				accent: "var(--color-secondary)",
				bg: "linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 14%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent))",
			};
		}

		if (timeOfDay === "morning" || hour < 12) {
			return {
				icon: Droplets,
				message: t("dashboard.reminder_water"),
				accent: "var(--color-primary)",
				bg: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-primary-light) 18%, transparent))",
			};
		}

		if (timeOfDay === "evening" || hour >= 17) {
			return {
				icon: Sparkles,
				message: t("dashboard.reminder_breathe"),
				accent: "var(--color-secondary)",
				bg: "linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 10%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent))",
			};
		}

		return {
			icon: Droplets,
			message: t("dashboard.reminder_water"),
			accent: "var(--color-primary)",
			bg: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-secondary) 10%, transparent))",
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
					aria-label={t("dashboard.reminder_label")}
					className="rounded-3xl p-4 shadow-[var(--shadow-card)] border"
					style={{
						background: reminder.bg,
						borderColor: "var(--color-border-soft)",
					}}
				>
					<div className="flex items-start gap-3">
						<div
							className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
							style={{ backgroundColor: "var(--color-surface-card)" }}
						>
							<Icon size={18} style={{ color: reminder.accent }} />
						</div>

						<div className="flex-1 min-w-0">
							<p
								className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1"
								style={{ color: "var(--color-text-muted)" }}
							>
								{t("dashboard.reminder_label")}
							</p>
							<p
								className="text-sm font-semibold leading-6"
								style={{ color: "var(--color-text-primary)" }}
							>
								{reminder.message}
							</p>
						</div>

						<button
							type="button"
							onClick={handleDismiss}
							className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:bg-black/5"
							aria-label={t("dashboard.dismiss_reminder")}
						>
							<X size={14} style={{ color: "var(--color-text-muted)" }} />
						</button>
					</div>
				</aside>
			</motion.div>
		</AnimatePresence>
	);
}

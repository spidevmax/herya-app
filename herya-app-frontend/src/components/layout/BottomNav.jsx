import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Home, Leaf, Plus, Sparkles, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function BottomNav() {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const [fabOpen, setFabOpen] = useState(false);

	const NAV_ITEMS = [
		{ to: "/", icon: Home, label: t("nav.home") },
		{ to: "/library", icon: BookOpen, label: t("nav.library") },
		null,
		{ to: "/garden", icon: Leaf, label: t("nav.journal") },
		{ to: "/profile", icon: User, label: t("nav.profile") },
	];

	const fabActions = [
		{
			label: t("fab.vk_sequence"),
			icon: Sparkles,
			color: "var(--color-primary)",
			to: "/session/vk_sequence",
		},
		{
			label: t("fab.pranayama"),
			icon: "PR",
			color: "var(--color-secondary)",
			to: "/session/pranayama",
		},
		{
			label: t("fab.meditation"),
			icon: "MD",
			color: "var(--color-accent)",
			to: "/session/meditation",
		},
		{
			label: t("fab.complete_practice"),
			icon: "FP",
			color: "var(--color-primary-light)",
			to: "/session/complete_practice",
		},
	];

	return (
		<>
			<AnimatePresence>
				{fabOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/20 z-40"
						onClick={() => setFabOpen(false)}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{fabOpen && (
					<div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
						{fabActions.map((action, i) => (
							<motion.button
								key={action.to}
								initial={{ opacity: 0, y: 20, scale: 0.8 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 10, scale: 0.8 }}
								transition={{ delay: (fabActions.length - 1 - i) * 0.06 }}
								onClick={() => {
									setFabOpen(false);
									navigate(action.to);
								}}
								className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-white font-semibold text-sm shadow-lg"
								style={{
									backgroundColor: action.color,
									fontFamily: '"DM Sans", sans-serif',
								}}
							>
								{typeof action.icon === "string" ? (
									<span className="text-[10px] font-semibold tracking-[0.08em]">
										{action.icon}
									</span>
								) : (
									<action.icon size={14} strokeWidth={2.4} />
								)}
								{action.label}
							</motion.button>
						))}
					</div>
				)}
			</AnimatePresence>

			<nav
				className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] sm:max-w-[540px] border-t z-40 backdrop-blur-xl"
				style={{
					backgroundColor:
						"color-mix(in srgb, var(--color-surface-card) 90%, transparent)",
					borderColor: "var(--color-border)",
				}}
			>
				<div className="flex items-center justify-around px-2 pt-2 pb-3">
					{NAV_ITEMS.map((item) => {
						if (!item) {
							return (
								<motion.button
									key="fab"
									onClick={() => setFabOpen((o) => !o)}
									whileTap={{ scale: 0.9 }}
									className="relative flex items-center justify-center w-14 h-14 rounded-full text-white -mt-5"
									style={{
										backgroundColor: "var(--color-primary)",
										boxShadow: "0 6px 24px rgba(107, 142, 95, 0.3)",
									}}
								>
									<motion.div
										animate={{ rotate: fabOpen ? 45 : 0 }}
										transition={{ duration: 0.2 }}
									>
										<Plus size={26} strokeWidth={2.5} />
									</motion.div>
								</motion.button>
							);
						}
						const Icon = item.icon;
						return (
							<NavLink
								key={item.to}
								to={item.to}
								end={item.to === "/"}
								className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-200"
								style={({ isActive }) => ({
									color: isActive
										? "var(--color-primary)"
										: "var(--color-text-muted)",
								})}
							>
								{({ isActive }) => (
									<>
										<motion.div
											animate={{ scale: isActive ? 1.1 : 1 }}
											transition={{ type: "spring", stiffness: 400 }}
										>
											<Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
										</motion.div>
										<span
											className="text-[10px] font-semibold tracking-wide"
											style={{
												color: isActive
													? "var(--color-primary)"
													: "var(--color-text-muted)",
												fontFamily: '"DM Sans", sans-serif',
											}}
										>
											{item.label}
										</span>
									</>
								)}
							</NavLink>
						);
					})}
				</div>
			</nav>
		</>
	);
}

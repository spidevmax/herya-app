import { useLocation, Outlet, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Home, Leaf, Plus, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";

const NAV_ITEMS = [
	{ to: "/", icon: Home, labelKey: "nav.home" },
	{ to: "/library", icon: BookOpen, labelKey: "nav.library" },
	{ to: "/garden", icon: Leaf, labelKey: "nav.journal" },
	{ to: "/profile", icon: User, labelKey: "nav.profile" },
];

const FAB_ACTIONS = [
	{
		label: "fab.vk_sequence",
		icon: Sparkles,
		color: "var(--color-primary)",
		to: "/session/vk_sequence",
	},
	{
		label: "fab.pranayama",
		icon: "PR",
		color: "var(--color-secondary)",
		to: "/session/pranayama",
	},
	{
		label: "fab.meditation",
		icon: "MD",
		color: "var(--color-accent)",
		to: "/session/meditation",
	},
	{
		label: "fab.complete_practice",
		icon: "FP",
		color: "var(--color-primary-light)",
		to: "/session/complete_practice",
	},
];

function DesktopSidebar() {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [fabOpen, setFabOpen] = useState(false);

	return (
		<aside
			className="hidden lg:flex flex-col gap-2 fixed left-0 top-0 h-full w-56 pt-8 pb-6 px-3 z-40 border-r"
			style={{
				backgroundColor: "var(--color-surface-card)",
				borderColor: "var(--color-border)",
			}}
		>
			{/* Logo */}
			<div className="px-3 mb-6">
				<h1
					className="text-2xl font-bold"
					style={{
						color: "var(--color-primary)",
						fontFamily: '"Fredoka", sans-serif',
					}}
				>
					Herya
				</h1>
			</div>

			{/* Nav links */}
			<nav className="flex flex-col gap-1 flex-1">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/"}
							className="flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-sm font-semibold"
							style={({ isActive }) => ({
								backgroundColor: isActive
									? "var(--color-primary)15"
									: "transparent",
								color: isActive
									? "var(--color-primary)"
									: "var(--color-text-secondary)",
							})}
						>
							{({ isActive }) => (
								<>
									<Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
									<span style={{ fontFamily: '"DM Sans", sans-serif' }}>
										{t(item.labelKey)}
									</span>
								</>
							)}
						</NavLink>
					);
				})}
			</nav>

			{/* FAB */}
			<div className="relative">
				<AnimatePresence>
					{fabOpen && (
						<div className="absolute bottom-14 left-0 right-0 flex flex-col gap-2 pb-2">
							{FAB_ACTIONS.map((action, i) => (
								<motion.button
									key={action.to}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 5 }}
									transition={{ delay: (FAB_ACTIONS.length - 1 - i) * 0.05 }}
									onClick={() => {
										setFabOpen(false);
										navigate(action.to);
									}}
									className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-semibold"
									style={{ backgroundColor: action.color }}
								>
									{typeof action.icon === "string" ? (
										<span className="text-[10px] font-bold tracking-wide">
											{action.icon}
										</span>
									) : (
										<action.icon size={14} strokeWidth={2.4} />
									)}
									{t(action.label)}
								</motion.button>
							))}
						</div>
					)}
				</AnimatePresence>
				<button
					type="button"
					onClick={() => setFabOpen((o) => !o)}
					className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm transition-all"
					style={{ backgroundColor: "var(--color-primary)" }}
				>
					<motion.span
						animate={{ rotate: fabOpen ? 45 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<Plus size={18} strokeWidth={2.5} />
					</motion.span>
					{t("fab.vk_sequence")}
				</button>
			</div>
		</aside>
	);
}

export default function AppLayout() {
	const location = useLocation();
	return (
		<div
			className="min-h-dvh"
			style={{ backgroundColor: "var(--color-surface)" }}
		>
			{/* Desktop sidebar — hidden on mobile/tablet */}
			<DesktopSidebar />

			{/* Main content area */}
			<div className="lg:ml-56 flex justify-center">
				<div
					className="w-full max-w-[430px] sm:max-w-[540px] lg:max-w-[680px] min-h-dvh flex flex-col"
					style={{ backgroundColor: "var(--color-surface)" }}
				>
					<AnimatePresence mode="wait">
						<PageTransition key={location.pathname}>
							<main className="pb-24 lg:pb-8 flex-1">
								<Outlet />
							</main>
						</PageTransition>
					</AnimatePresence>

					{/* Bottom nav — hidden on desktop */}
					<div className="lg:hidden">
						<BottomNav />
					</div>
				</div>
			</div>
		</div>
	);
}

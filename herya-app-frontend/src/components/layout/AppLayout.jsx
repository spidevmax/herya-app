import { useLocation, Outlet, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BookOpen, Home, Leaf, Plus, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";

const NAV_ITEMS = [
	{ to: "/", icon: Home, labelKey: "nav.home" },
	{ to: "/library", icon: BookOpen, labelKey: "nav.library" },
	{ to: "/journal", icon: Leaf, labelKey: "nav.journal" },
	{ to: "/profile", icon: User, labelKey: "nav.profile" },
];

function DesktopSidebar() {
	const { t } = useLanguage();
	const navigate = useNavigate();

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
				<h1 className="text-2xl font-bold text-[var(--color-primary)]">
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
									<span>
										{t(item.labelKey)}
									</span>
								</>
							)}
						</NavLink>
					);
				})}
			</nav>

			{/* Start Practice button */}
			<button
				type="button"
				onClick={() => navigate("/start-practice")}
				className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:brightness-95 active:scale-[0.97]"
				style={{ backgroundColor: "var(--color-primary)" }}
			>
				<Plus size={18} strokeWidth={2.5} />
				{t("practice.start_practice")}
			</button>
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

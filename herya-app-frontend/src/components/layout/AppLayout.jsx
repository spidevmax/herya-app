import { AnimatePresence } from "framer-motion";
import { BookOpen, Home, Leaf, Plus, User } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import BreathMark from "@/components/identity/BreathMark";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";
import "@/styles/identity.css";

const NAV_ITEMS_BASE = [
	{ to: "/", icon: Home, labelKey: "nav.home" },
	{ to: "/library", icon: BookOpen, labelKey: "nav.library" },
	{ to: "/journal", icon: Leaf, labelKey: "nav.journal" },
	{ to: "/profile", icon: User, labelKey: "nav.profile" },
];

export const DesktopSidebar = () => {
	const { t } = useLanguage();
	const navigate = useNavigate();
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";
	const NAV_ITEMS = isAdmin
		? NAV_ITEMS_BASE.filter((item) => item.to !== "/journal")
		: NAV_ITEMS_BASE;

	return (
		<aside
			data-identity="next"
			aria-label={t("nav.main")}
			className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col gap-2 px-3 pb-6 pt-8 lg:flex"
			style={{
				background: "var(--paper-raised)",
				borderRight: "var(--ink-width) solid var(--ink)",
			}}
		>
			<div className="mb-7 flex items-center gap-2.5 px-2">
				<BreathMark size={30} />
				<span className="display text-[1.25rem]">Herya</span>
			</div>

			<nav className="flex flex-1 flex-col gap-1.5">
				{NAV_ITEMS.map((item) => {
					const Icon = item.icon;
					return (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === "/"}
							className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold"
							style={({ isActive }) => ({
								// Ink fill for the current section — the same device the
								// role toggle and bottom nav use, so "selected" always
								// looks the same across the app.
								background: isActive ? "var(--ink)" : "transparent",
								color: isActive ? "var(--paper)" : "var(--ink-soft)",
								border: `var(--ink-width) solid ${isActive ? "var(--ink)" : "transparent"}`,
								borderRadius: "var(--radius-block)",
							})}
						>
							{({ isActive }) => (
								<>
									<Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
									<span>{t(item.labelKey)}</span>
								</>
							)}
						</NavLink>
					);
				})}
			</nav>

			{!isAdmin && (
				<button
					type="button"
					onClick={() => navigate("/start-practice")}
					className="ink-block ink-block--press flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
					style={{
						background: "var(--surya)",
						color: "var(--on-fill)",
						cursor: "pointer",
					}}
				>
					<Plus size={18} strokeWidth={2.5} aria-hidden="true" />
					{t("practice.start_practice")}
				</button>
			)}
		</aside>
	);
};

const AppLayout = () => {
	const location = useLocation();
	return (
		<div className="min-h-dvh" style={{ backgroundColor: "var(--color-surface)" }}>
			<DesktopSidebar />

			{/* Content keeps the previous tokens until each page is migrated, so
			    the shell can change without touching 48 components at once. */}
			<div className="flex justify-center lg:ml-56">
				<div
					className="flex min-h-dvh w-full max-w-[430px] flex-col sm:max-w-[540px] lg:max-w-[680px] xl:max-w-[900px]"
					style={{ backgroundColor: "var(--color-surface)" }}
				>
					<AnimatePresence mode="wait">
						<PageTransition key={location.pathname}>
							<main className="flex-1 pb-24 lg:pb-8">
								<Outlet />
							</main>
						</PageTransition>
					</AnimatePresence>

					<footer className="lg:hidden">
						<BottomNav />
					</footer>
				</div>
			</div>
		</div>
	);
};

export default AppLayout;

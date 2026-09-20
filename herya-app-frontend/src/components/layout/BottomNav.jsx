import { BookOpen, Home, Leaf, Plus, User } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

const BottomNav = () => {
	const navigate = useNavigate();
	const { t } = useLanguage();
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";

	const NAV_ITEMS = [
		{ to: "/", icon: Home, label: t("nav.home") },
		{ to: "/library", icon: BookOpen, label: t("nav.library") },
		!isAdmin && { fab: true },
		!isAdmin && { to: "/journal", icon: Leaf, label: t("nav.journal") },
		{ to: "/profile", icon: User, label: t("nav.profile") },
	].filter(Boolean);

	return (
		<nav
			data-identity="next"
			aria-label={t("nav.main")}
			className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:max-w-[540px] lg:hidden"
			style={{
				background: "var(--paper-raised)",
				borderTop: "var(--ink-width) solid var(--ink)",
			}}
		>
			<ul className="relative m-0 flex list-none items-end justify-around px-2 pt-2 pb-3">
				{NAV_ITEMS.map((item) => {
					if (item.fab) {
						return (
							<li key="fab" className="relative z-50">
								<button
									type="button"
									onClick={() => navigate("/start-practice")}
									aria-label={t("fab.vk_sequence")}
									className="ink-block ink-block--press -mt-9 flex h-14 w-14 items-center justify-center"
									style={{
										background: "var(--surya)",
										color: "var(--on-fill)",
										borderRadius: "999px",
										cursor: "pointer",
									}}
								>
									<Plus size={26} strokeWidth={2.5} aria-hidden="true" />
								</button>
							</li>
						);
					}

					const Icon = item.icon;
					return (
						<li key={item.to}>
							<NavLink
								to={item.to}
								end={item.to === "/"}
								className="flex flex-col items-center gap-1 px-2 py-1"
							>
								{({ isActive }) => (
									<>
										{/* The active item fills with ink rather than tinting,
										    so the current section survives a glance and does not
										    rely on colour alone. */}
										<span
											aria-hidden="true"
											className="inline-flex h-9 w-11 items-center justify-center"
											style={{
												background: isActive ? "var(--ink)" : "transparent",
												color: isActive ? "var(--paper)" : "var(--ink-soft)",
												border: isActive
													? "var(--ink-width) solid var(--ink)"
													: "var(--ink-width) solid transparent",
												borderRadius: "var(--radius-block)",
											}}
										>
											<Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
										</span>
										<span
											className="text-[10px] font-bold"
											style={{ color: isActive ? "var(--ink)" : "var(--ink-soft)" }}
										>
											{item.label}
										</span>
									</>
								)}
							</NavLink>
						</li>
					);
				})}
			</ul>
		</nav>
	);
};

export default BottomNav;

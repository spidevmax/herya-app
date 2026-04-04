import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Home, Leaf, Plus, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function BottomNav() {
	const navigate = useNavigate();
	const { t } = useLanguage();

	const NAV_ITEMS = [
		{ to: "/", icon: Home, label: t("nav.home") },
		{ to: "/library", icon: BookOpen, label: t("nav.library") },
		null,
		{ to: "/journal", icon: Leaf, label: t("nav.journal") },
		{ to: "/profile", icon: User, label: t("nav.profile") },
	];

	return (
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
								onClick={() => navigate("/start-practice")}
								whileTap={{ scale: 0.9 }}
								aria-label={t("fab.vk_sequence")}
								className="relative flex items-center justify-center w-14 h-14 rounded-full text-white -mt-5"
								style={{
									backgroundColor: "var(--color-primary)",
									boxShadow: "var(--shadow-fab)",
								}}
							>
								<Plus size={26} strokeWidth={2.5} />
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
	);
}

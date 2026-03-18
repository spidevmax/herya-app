import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BookOpen, Leaf, User, Plus } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/library", icon: BookOpen, label: "Library" },
  null,
  { to: "/garden", icon: Leaf, label: "Garden" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  const fabActions = [
    { label: "VK Sequence", icon: "🧘", color: "#4A72FF", to: "/session/vk_sequence" },
    { label: "Pranayama", icon: "💨", color: "#5DB075", to: "/session/pranayama" },
    { label: "Meditation", icon: "🌿", color: "#9B5DE5", to: "/session/meditation" },
    { label: "Full Practice", icon: "⭐", color: "#FFB347", to: "/session/complete_practice" },
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
                onClick={() => { setFabOpen(false); navigate(action.to); }}
                className="flex items-center gap-3 px-5 py-2.5 rounded-2xl text-white font-semibold text-sm shadow-lg"
                style={{ backgroundColor: action.color }}
              >
                <span className="text-lg">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/90 backdrop-blur-xl border-t border-[#E8E4DE] z-40">
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {NAV_ITEMS.map((item, idx) => {
            if (!item) {
              return (
                <motion.button
                  key="fab"
                  onClick={() => setFabOpen((o) => !o)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#4A72FF] text-white shadow-[0_6px_24px_rgba(74,114,255,0.4)] -mt-5"
                >
                  <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
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
                className={({ isActive }) =>
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-200 " +
                  (isActive ? "text-[#4A72FF]" : "text-[#9CA3AF]")
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div animate={{ scale: isActive ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    </motion.div>
                    <span className={"text-[10px] font-semibold tracking-wide " + (isActive ? "text-[#4A72FF]" : "text-[#9CA3AF]")}>
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

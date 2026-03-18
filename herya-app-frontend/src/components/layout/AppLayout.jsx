import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-dvh bg-[#F8F7F4]">
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <main className="pb-24">
            <Outlet />
          </main>
        </PageTransition>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

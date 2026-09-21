import { motion, useReducedMotion } from "framer-motion";

/*
 * Page transitions are a fade only — no slide.
 *
 * Movement on every navigation is noise in an app used by people with
 * sensory sensitivities, and by tutors guiding children who are already
 * being asked to settle. A crossfade keeps continuity between screens
 * without anything travelling across the viewport.
 *
 * When the operating system asks for reduced motion, the transition is
 * dropped entirely rather than shortened.
 */
const PageTransition = ({ children }) => {
	const reduceMotion = useReducedMotion();

	if (reduceMotion) return <div>{children}</div>;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.18, ease: "easeOut" }}
		>
			{children}
		</motion.div>
	);
};

export default PageTransition;

import BreathMark from "@/components/identity/BreathMark";
import "@/styles/identity.css";

/*
 * Shared frame for the narrow auth screens (password recovery and reset).
 *
 * Login and Register earn the two-panel layout because they are the front
 * door. These two are interruptions in a flow someone is already in, so they
 * stay a single quiet column — no character, no colour field, nothing that
 * competes with the one thing being asked for.
 *
 * Replaces AuthBrandHeader, whose gradient tile and blurred dots belonged to
 * the previous identity.
 */
export default function AuthShell({ children }) {
	return (
		<div
			data-identity="next"
			className="flex min-h-dvh w-full flex-col items-center justify-center px-5 py-10"
			style={{ background: "var(--paper)" }}
		>
			<div className="w-full max-w-[26rem]">
				<div className="mb-8 flex items-center gap-3">
					<BreathMark size={34} />
					<span className="display text-[1.4rem]">Herya</span>
				</div>
				{children}
			</div>
		</div>
	);
}

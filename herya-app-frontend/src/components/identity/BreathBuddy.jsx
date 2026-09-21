/*
 * BreathBuddy — the character.
 *
 * Not decoration: the figure IS the breath pacer. It expands on the inhale,
 * holds, contracts on the exhale, driven by the same ratio the pranayama
 * engine uses. A practitioner can follow the shape without reading a number.
 *
 * Built as geometry rather than illustration so it inherits the identity
 * tokens, scales losslessly and costs bytes instead of the 654 KB the
 * previous raster mascot cost.
 *
 * `phase` is "inhale" | "hold" | "exhale". Eyes close on the hold.
 *
 * `outline` exists because the figure usually sits ON a colour fill, where
 * theme ink would turn near-white in dark mode and wash the character out.
 * On a colour panel pass "var(--on-fill)"; on paper leave the default.
 */
export default function BreathBuddy({
	size = 140,
	phase = "inhale",
	fill = "var(--surya)",
	outline = "var(--ink)",
}) {
	const scale = phase === "inhale" ? 1 : phase === "hold" ? 1 : 0.82;
	const holding = phase === "hold";

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 120 120"
			role="img"
			aria-label={`Breath guide, ${phase}`}
			fill="none"
		>
			<title>{`Breath guide, ${phase}`}</title>

			{/* limbs sit behind the body, drawn as single strokes */}
			<g stroke={outline} strokeWidth="3" strokeLinecap="round">
				<path d="M34 78 Q22 90 26 102" />
				<path d="M86 78 Q98 90 94 102" />
				<circle cx="26" cy="104" r="4" fill={outline} />
				<circle cx="94" cy="104" r="4" fill={outline} />
			</g>

			{/* body — the part that breathes */}
			<g
				style={{
					transform: `scale(${scale})`,
					transformOrigin: "60px 62px",
					transition: "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)",
				}}
			>
				<rect
					x="26"
					y="28"
					width="68"
					height="62"
					rx="22"
					fill={fill}
					stroke={outline}
					strokeWidth="3"
				/>

				{/* eyes: dots open, arcs closed on the retention */}
				{holding ? (
					<g
						stroke="var(--on-fill)"
						strokeWidth="3"
						strokeLinecap="round"
						fill="none"
					>
						<path d="M44 58 Q49 63 54 58" />
						<path d="M66 58 Q71 63 76 58" />
					</g>
				) : (
					<g fill="var(--on-fill)">
						<circle cx="49" cy="58" r="4" />
						<circle cx="71" cy="58" r="4" />
					</g>
				)}

				{/* mouth opens with the body: a small o on the inhale */}
				<ellipse
					cx="60"
					cy="73"
					rx={phase === "inhale" ? 5 : 7}
					ry={phase === "inhale" ? 6 : 3}
					fill="var(--on-fill)"
				/>
			</g>
		</svg>
	);
}

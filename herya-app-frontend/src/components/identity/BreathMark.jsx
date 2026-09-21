/*
 * BreathMark — the logo.
 *
 * One ring drawn as two arcs: surya (warming, inhalation) and chandra
 * (cooling, exhalation). The two gaps are the retentions that sit between
 * them — in Vinyasa Krama the pause is part of the cycle, not the absence of
 * one, so the mark is deliberately not a closed circle.
 *
 * Single stroke weight, no fill, no gradient: legible down to favicon size
 * and recolourable straight from the identity tokens.
 *
 * Both arc colours can be overridden, because each arc has to be visible
 * against whatever is behind it. For example, on a blue (chandra) panel the
 * blue arc would blend into the background and disappear, so there you pass
 * cool="var(--on-fill)" to draw it in dark ink instead.
 */
const BreathMark = ({
	size = 48,
	title = "Breath mark",
	warm = "var(--surya)",
	cool = "var(--chandra)",
}) => {
	const S = 48;
	const c = S / 2;
	const r = 17;
	const w = 7;

	const point = (deg) => {
		const rad = ((deg - 90) * Math.PI) / 180;
		return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
	};

	const arc = (startDeg, endDeg) => {
		const [x1, y1] = point(startDeg);
		const [x2, y2] = point(endDeg);
		const large = endDeg - startDeg > 180 ? 1 : 0;
		return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
	};

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${S} ${S}`}
			role="img"
			aria-label={title}
			fill="none"
		>
			<title>{title}</title>
			{/* right side — surya, the warming channel */}
			<path
				d={arc(10, 170)}
				stroke={warm}
				strokeWidth={w}
				strokeLinecap="round"
			/>
			{/* left side — chandra, the cooling channel */}
			<path
				d={arc(190, 350)}
				stroke={cool}
				strokeWidth={w}
				strokeLinecap="round"
			/>
		</svg>
	);
};

export default BreathMark;

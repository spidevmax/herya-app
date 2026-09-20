export default function SectionTitle({ children }) {
	return (
		<h2
			className="text-[11px] font-bold"
			style={{ color: "var(--ink-soft)" }}
		>
			{children}
		</h2>
	);
}

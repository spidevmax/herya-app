export default function SectionTitle({ children }) {
	return (
		<h2
			className="text-[11px] font-bold uppercase tracking-[0.12em]"
			style={{ color: "var(--color-text-muted)" }}
		>
			{children}
		</h2>
	);
}

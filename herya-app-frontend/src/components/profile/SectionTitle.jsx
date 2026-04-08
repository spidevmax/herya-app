export default function SectionTitle({ children }) {
	return (
		<p
			className="text-[11px] font-bold uppercase tracking-[0.12em]"
			style={{ color: "var(--color-text-muted)" }}
		>
			{children}
		</p>
	);
}

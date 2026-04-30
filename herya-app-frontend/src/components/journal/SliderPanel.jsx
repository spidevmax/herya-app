const SOFT_PANEL_STYLE = {
	border: "1px solid color-mix(in srgb, var(--color-border-soft) 68%, transparent)",
	background:
		"linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, white 8%) 0%, var(--color-surface) 100%)",
};

const SliderPanel = ({
	id,
	label,
	value,
	onChange,
	accent = "var(--color-primary)",
	lowLabel,
	highLabel,
	min = 1,
	max = 10,
}) => (
	<div className="rounded-2xl p-4" style={SOFT_PANEL_STYLE}>
		<div className="mb-3 flex items-center justify-between gap-3">
			<label
				htmlFor={id}
				className="text-sm font-semibold text-[var(--color-text-primary)]"
			>
				{label}
			</label>
			<span
				className="min-w-[56px] rounded-full px-2.5 py-1 text-center text-xs font-bold"
				style={{
					backgroundColor: `color-mix(in srgb, ${accent} 14%, white 86%)`,
					color: accent,
				}}
			>
				{value}/{max}
			</span>
		</div>
		<input
			id={id}
			type="range"
			min={min}
			max={max}
			value={value}
			aria-label={label}
			onChange={onChange}
			className="w-full"
			style={{ accentColor: accent }}
		/>
		<div className="mt-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
			<span>{lowLabel}</span>
			<span>{highLabel}</span>
		</div>
	</div>
);

export default SliderPanel;

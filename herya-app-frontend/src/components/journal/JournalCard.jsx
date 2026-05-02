const TONE_STYLES = {
	default: {
		border:
			"1px solid color-mix(in srgb, var(--color-border-soft) 72%, transparent)",
		background:
			"linear-gradient(180deg, color-mix(in srgb, var(--color-surface-card) 94%, white 6%) 0%, var(--color-surface-card) 100%)",
	},
	soft: {
		border:
			"1px solid color-mix(in srgb, var(--color-secondary) 12%, var(--color-border-soft) 88%)",
		background:
			"linear-gradient(180deg, color-mix(in srgb, var(--color-secondary) 5%, var(--color-surface-card) 95%) 0%, var(--color-surface-card) 100%)",
	},
};

const JournalCard = ({
	title,
	subtitle = null,
	children,
	tone = "default",
	withShadow = true,
}) => (
	<section
		className={`rounded-[28px] p-5 sm:p-6 ${withShadow ? "shadow-[var(--shadow-card)]" : ""}`}
		style={TONE_STYLES[tone] || TONE_STYLES.default}
	>
		<div className="mb-4">
			<h2 className="m-0 font-display text-2xl font-bold text-[var(--color-text-primary)]">
				{title}
			</h2>
			{subtitle && (
				<p className="mt-1 mb-0 text-sm text-[var(--color-text-muted)]">
					{subtitle}
				</p>
			)}
		</div>
		{children}
	</section>
);

export default JournalCard;

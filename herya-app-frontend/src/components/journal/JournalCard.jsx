const TONE_STYLES = {
	default: {
		border: "1px solid color-mix(in srgb, var(--ink) 72%, transparent)",
		background: "var(--paper-raised)",
	},
	soft: {
		border: "1px solid color-mix(in srgb, var(--surya) 12%, var(--ink) 88%)",
		background: "var(--paper-raised)",
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
		className={`rounded-[28px] p-5 sm:p-6 ${withShadow ? "" : ""}`}
		style={TONE_STYLES[tone] || TONE_STYLES.default}
	>
		<div className="mb-4">
			<h2 className="m-0 font-display text-2xl font-bold text-[var(--ink)]">
				{title}
			</h2>
			{subtitle && (
				<p className="mt-1 mb-0 text-sm text-[var(--ink-soft)]">{subtitle}</p>
			)}
		</div>
		{children}
	</section>
);

export default JournalCard;

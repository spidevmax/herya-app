// Canonical body-sensation vocabulary shared by all journal entry screens
// (check-in, post-practice, and the detail editor). Affective states like
// "calm" or "focused" belong in moodBefore/moodAfter, not here.
export const DEFAULT_SENSATIONS = [
	// body quality
	"relaxed",
	"energized",
	"light",
	"heavy",
	"open",
	"tight",
	"warm",
	"cool",
	// physical aches / focal points
	"tight_shoulders",
	"sore_back",
	"tight_hips",
	"stiff_neck",
];

export const SENSATION_I18N_PREFIX = "journal.sensations";

const SensationChip = ({ label, active, onToggle }) => (
	<button
		type="button"
		onClick={onToggle}
		aria-pressed={active}
		className="px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5"
		style={{
			background: active ? "var(--chandra)" : "var(--paper-raised)",
			color: active ? "var(--on-fill)" : "var(--ink-soft)",
			borderColor: active
				? "var(--chandra)"
				: "color-mix(in srgb, var(--ink) 75%, transparent)",
			boxShadow: active ? "0 10px 24px rgba(32, 73, 158, 0.14)" : "none",
		}}
	>
		{label}
	</button>
);

const SensationChips = ({
	options = DEFAULT_SENSATIONS,
	value = [],
	onToggle,
	getLabel,
}) => (
	<div className="flex flex-wrap gap-2.5">
		{options.map((s) => (
			<SensationChip
				key={s}
				label={getLabel ? getLabel(s) : s}
				active={value.includes(s)}
				onToggle={() => onToggle(s)}
			/>
		))}
	</div>
);

export default SensationChips;

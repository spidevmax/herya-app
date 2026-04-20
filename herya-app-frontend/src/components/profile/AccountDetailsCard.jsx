import SectionTitle from "./SectionTitle";
import { useLanguage } from "@/context/LanguageContext";

const GOAL_OPTIONS = [
	"increase_flexibility",
	"build_strength",
	"reduce_stress",
	"improve_balance",
	"therapeutic_healing",
	"deepen_practice",
	"meditation_focus",
	"breath_awareness",
];

const cardStyle = { backgroundColor: "var(--color-surface-card)" };
const inputStyle = {
	backgroundColor: "var(--color-surface)",
	borderColor: "var(--color-border)",
	color: "var(--color-text-primary)",
};

export default function AccountDetailsCard({
	draft,
	setDraft,
	selectedGoals,
	toggleArrayItem,
	fieldErrors,
	hideGoals = false,
}) {
	const { t } = useLanguage();

	const getOptionLabel = (group, key) =>
		t(`profile.option_labels.${group}.${key}`);

	const fieldErrorStyle = (field) =>
		fieldErrors[field]
			? { ...inputStyle, borderColor: "var(--color-danger)" }
			: inputStyle;

	return (
		<section
			aria-label={t("profile.account_details")}
			className="rounded-3xl p-5 sm:p-6 space-y-5 shadow-[var(--shadow-card)]"
			style={cardStyle}
		>
			<SectionTitle>{t("profile.account_details")}</SectionTitle>
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
				<label className="space-y-1.5 text-sm">
					<span
						className="font-semibold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("profile.name")}
					</span>
					<input
						value={draft.name}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								name: event.target.value,
							}))
						}
						className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
						style={fieldErrorStyle("name")}
					/>
					{fieldErrors.name && (
						<p
							role="alert"
							className="text-xs mt-0.5"
							style={{ color: "var(--color-danger)" }}
						>
							{fieldErrors.name}
						</p>
					)}
				</label>
				<label className="space-y-1.5 text-sm">
					<span
						className="font-semibold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("profile.email")}
					</span>
					<input
						value={draft.email}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								email: event.target.value,
							}))
						}
						className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
						style={fieldErrorStyle("email")}
					/>
					{fieldErrors.email && (
						<p
							role="alert"
							className="text-xs mt-0.5"
							style={{ color: "var(--color-danger)" }}
						>
							{fieldErrors.email}
						</p>
					)}
				</label>
				<label className="space-y-1.5 text-sm">
					<span
						className="font-semibold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{t("profile.pronouns")}
					</span>
					<input
						value={draft.pronouns}
						onChange={(event) =>
							setDraft((current) => ({
								...current,
								pronouns: event.target.value,
							}))
						}
						placeholder={t("profile.pronouns_placeholder")}
						className="w-full rounded-xl px-4 py-3 text-sm border outline-none"
						style={inputStyle}
					/>
				</label>
			</div>

			{/* Goals */}
			{!hideGoals && (
				<div>
					<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
						<p
							className="text-sm font-semibold"
							style={{ color: "var(--color-text-primary)" }}
						>
							{t("profile.goals_title")}
						</p>
						<span
							className="text-xs"
							style={{ color: "var(--color-text-muted)" }}
						>
							{t("profile.goals_hint")}
						</span>
					</div>
					<div className="flex flex-wrap gap-2" role="group" aria-label={t("profile.goals_title")}>
						{GOAL_OPTIONS.map((goal) => {
							const active = selectedGoals.includes(goal);
							return (
								<button
									key={goal}
									type="button"
									onClick={() => toggleArrayItem("goals", goal)}
									aria-pressed={active}
									className="px-3 py-2 rounded-full text-xs font-semibold transition-colors duration-150"
									style={{
										backgroundColor: active
											? "var(--color-primary)"
											: "var(--color-surface)",
										color: active ? "white" : "var(--color-text-secondary)",
										border: "1px solid var(--color-border)",
									}}
								>
									{getOptionLabel("goals", goal)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</section>
	);
}

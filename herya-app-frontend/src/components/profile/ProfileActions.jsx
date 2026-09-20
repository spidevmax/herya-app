import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";
import SectionTitle from "./SectionTitle";

const cardStyle = { backgroundColor: "var(--paper-raised)" };

export default function ProfileActions({
	savingProfile,
	saveSuccess,
	saveError,
	isDirty,
	onSave,
	onLogout,
	onDeleteClick,
}) {
	const { t } = useLanguage();

	return (
		<section
			aria-label={t("profile.actions_title")}
			className="ink-block space-y-3 p-5"
			style={cardStyle}
		>
			<SectionTitle>{t("profile.actions_title")}</SectionTitle>

			{saveError && (
				<div
					role="alert"
					className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
					style={{
						backgroundColor: "var(--paper-raised)",
						border: "var(--ink-width) solid var(--surya)",
						color: "var(--ink)",
					}}
				>
					{saveError}
				</div>
			)}

			{/* Save — primary CTA */}
			<Button
				variant="primary"
				onClick={onSave}
				disabled={savingProfile || saveSuccess || !isDirty}
				className="w-full transition-colors duration-300"
				style={
					saveSuccess
						? {
								backgroundColor: "var(--ink)",
								boxShadow: "none",
							}
						: {}
				}
			>
				{savingProfile
					? t("profile.saving_changes")
					: saveSuccess
						? t("profile.saved")
						: t("profile.save_changes")}
			</Button>

			<Button
				variant="ghost"
				onClick={onLogout}
				className="flex items-center justify-center gap-2 w-full"
				style={{ color: "var(--ink-soft)" }}
			>
				<LogOut size={16} />
				{t("profile.logout")}
			</Button>

			{/* Separator + destructive delete */}
			<div
				className="pt-4 mt-1 border-t"
				style={{ borderColor: "var(--ink)" }}
			>
				<button
					type="button"
					onClick={onDeleteClick}
					className="w-full text-sm py-1.5 transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
					style={{
						color: "var(--alert)",
						outlineColor: "var(--alert)",
					}}
				>
					{t("profile.delete_account")}
				</button>
			</div>
		</section>
	);
}

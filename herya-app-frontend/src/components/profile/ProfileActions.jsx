import { LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import SectionTitle from "./SectionTitle";

const cardStyle = { backgroundColor: "var(--color-surface-card)" };

export default function ProfileActions({
	user,
	savingProfile,
	saveSuccess,
	saveError,
	isDirty,
	onSave,
	onLogout,
	onDeleteClick,
}) {
	const navigate = useNavigate();
	const { t } = useLanguage();

	return (
		<div
			className="rounded-3xl p-5 space-y-3 shadow-[var(--shadow-card)]"
			style={cardStyle}
		>
			<SectionTitle>{t("profile.actions_title")}</SectionTitle>

			{saveError && (
				<div
					role="alert"
					className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold"
					style={{
						backgroundColor: "var(--color-warning-bg)",
						border: "1px solid var(--color-warning-border)",
						color: "var(--color-text-primary)",
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
								backgroundColor: "var(--color-success)",
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

			{/* Admin Panel */}
			{user?.role === "admin" && (
				<Button
					variant="outline"
					onClick={() => navigate("/admin")}
					className="flex items-center justify-center gap-2 w-full"
					style={{ color: "var(--color-primary)" }}
				>
					<Shield size={16} />
					{t("profile.admin_panel")}
				</Button>
			)}

			<Button
				variant="ghost"
				onClick={onLogout}
				className="flex items-center justify-center gap-2 w-full"
				style={{ color: "var(--color-text-secondary)" }}
			>
				<LogOut size={16} />
				{t("profile.logout")}
			</Button>

			{/* Separator + destructive delete */}
			<div
				className="pt-4 mt-1 border-t"
				style={{ borderColor: "var(--color-border)" }}
			>
				<button
					type="button"
					onClick={onDeleteClick}
					className="w-full text-sm py-1.5 transition-opacity hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
					style={{
						color: "var(--color-danger)",
						outlineColor: "var(--color-danger)",
					}}
				>
					{t("profile.delete_account")}
				</button>
			</div>
		</div>
	);
}

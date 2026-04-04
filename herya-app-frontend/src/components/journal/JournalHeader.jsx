import { useLanguage } from "@/context/LanguageContext";

export const JournalHeader = ({ entryCount }) => {
	const { t } = useLanguage();

	return (
		<div className="flex items-start justify-between px-4">
			<div>
				<h1 className="font-display text-2xl font-bold text-[var(--color-primary)]">
					{t("journal.title")}
				</h1>
				<p
					className="text-sm mt-1"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{entryCount}{" "}
					{entryCount !== 1
						? t("journal.entries_plural")
						: t("journal.entries_singular")}
				</p>
			</div>
		</div>
	);
};

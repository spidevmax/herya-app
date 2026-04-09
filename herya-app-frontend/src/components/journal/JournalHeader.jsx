import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui";

export const JournalHeader = ({ entryCount }) => {
	const { t } = useLanguage();

	return (
		<PageHeader
			title={t("journal.title")}
			titleClassName="text-[var(--color-primary)]"
			description={`${entryCount} ${
				entryCount !== 1
					? t("journal.entries_plural")
					: t("journal.entries_singular")
			}`}
		/>
	);
};

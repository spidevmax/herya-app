import { PageHeader } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";
import "@/styles/identity.css";

export const JournalHeader = ({ entryCount }) => {
	const { t } = useLanguage();

	return (
		<PageHeader
			title={t("journal.title")}
			titleClassName="text-[var(--chandra)]"
			description={`${entryCount} ${
				entryCount !== 1
					? t("journal.entries_plural")
					: t("journal.entries_singular")
			}`}
		/>
	);
};

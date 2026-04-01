import { createContext, useContext, useState } from "react";
import { translations } from '@/i18n/translations';

const LanguageContext = createContext(null);
const SUPPORTED_LANGS = ["es", "en"];

function normalizeLang(value) {
	if (!value || typeof value !== "string") return null;
	const short = value.toLowerCase().split("-")[0];
	return SUPPORTED_LANGS.includes(short) ? short : null;
}

function getInitialLanguage() {
	const saved = normalizeLang(localStorage.getItem("herya_lang"));
	if (saved) return saved;

	const browserCandidates = [
		...(navigator.languages || []),
		navigator.language,
		navigator.userLanguage,
	];

	for (const candidate of browserCandidates) {
		const detected = normalizeLang(candidate);
		if (detected) return detected;
	}

	return "es";
}

function getNestedValue(obj, path) {
	return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function interpolate(str, vars) {
	if (!vars || typeof str !== "string") return str;
	return str.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export function LanguageProvider({ children }) {
	const [lang, setLang] = useState(getInitialLanguage);

	const t = (key, vars) => {
		const str =
			getNestedValue(translations[lang], key) ??
			getNestedValue(translations.es, key) ??
			key;
		return interpolate(str, vars);
	};

	const setLanguage = (newLang) => {
		setLang(newLang);
		localStorage.setItem("herya_lang", newLang);
	};

	return (
		<LanguageContext.Provider value={{ lang, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
}

export const useLanguage = () => {
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
	return ctx;
};

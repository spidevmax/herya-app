const LOCALE_MAP = { en: "en-US", es: "es-ES" };
const toLocale = (lang) => LOCALE_MAP[lang] || lang || "en-US";

export const format = {
	date: (d, lang) => {
		if (!d) return "";
		const dt = new Date(d);
		const today = new Date();
		// Compare by calendar date (DST-safe) instead of ms division
		const dtDate = dt.toDateString();
		const todayDate = today.toDateString();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (dtDate === todayDate) return lang === "es" ? "Hoy" : "Today";
		if (dtDate === yesterday.toDateString())
			return lang === "es" ? "Ayer" : "Yesterday";
		return dt.toLocaleDateString(toLocale(lang), {
			month: "short",
			day: "numeric",
		});
	},
	time: (d, lang) =>
		new Date(d).toLocaleTimeString(toLocale(lang), {
			hour: "2-digit",
			minute: "2-digit",
		}),
	duration: (mins) => {
		if (!mins) return "";
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		if (h === 0) return `${m}m`;
		if (m === 0) return `${h}h`;
		return `${h}h ${m}m`;
	},
};

export const getDayOfYear = (date) => {
	const d = new Date(date);
	const start = new Date(d.getFullYear(), 0, 0);
	return Math.floor((d - start) / 86400000);
};

export const groupBy = (arr, keyFn) =>
	arr.reduce((acc, item) => {
		const k = keyFn(item);
		if (!acc[k]) acc[k] = [];
		acc[k].push(item);
		return acc;
	}, {});

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

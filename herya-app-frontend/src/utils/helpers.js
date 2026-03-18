export const format = {
	date: (d) => {
		if (!d) return "";
		const dt = new Date(d);
		const today = new Date();
		const diff = Math.floor((today - dt) / 86400000);
		if (diff === 0) return "Today";
		if (diff === 1) return "Yesterday";
		return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	},
	time: (d) =>
		new Date(d).toLocaleTimeString("en-US", {
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

import { Compass, House, LibraryBig, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
	const navigate = useNavigate();
	const { t } = useLanguage();

	return (
		<main className="min-h-dvh flex items-center justify-center px-6 py-10">
			<article
				className="w-full max-w-xl rounded-3xl p-7 sm:p-9"
				style={{
					backgroundColor: "var(--color-surface-card)",
					border: "1px solid var(--color-border-soft)",
					boxShadow: "var(--shadow-card)",
				}}
			>
				<div className="flex items-center gap-3 mb-5">
					<div
						className="w-12 h-12 rounded-2xl flex items-center justify-center"
						style={{
							backgroundColor:
								"color-mix(in srgb, var(--color-warning) 16%, transparent)",
							color: "var(--color-warning)",
						}}
					>
						<TriangleAlert size={24} />
					</div>
					<span
						className="text-xs font-bold uppercase tracking-[0.14em]"
						style={{ color: "var(--color-text-muted)" }}
					>
						404
					</span>
				</div>

				<h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 text-[var(--color-text-primary)]">
					{t("not_found.title")}
				</h1>

				<p
					className="text-sm sm:text-base mb-6"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{t("not_found.description")}
				</p>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
					<Button onClick={() => navigate("/")} className="w-full">
						<House size={16} />
						{t("not_found.go_home")}
					</Button>
					<Button
						variant="outline"
						onClick={() => navigate("/library")}
						className="w-full"
					>
						<LibraryBig size={16} />
						{t("not_found.go_library")}
					</Button>
				</div>

				<button
					type="button"
					onClick={() => navigate(-1)}
					className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold"
					style={{ color: "var(--color-primary)" }}
				>
					<Compass size={14} />
					{t("not_found.go_back")}
				</button>
			</article>
		</main>
	);
}

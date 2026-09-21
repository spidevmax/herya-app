import { Clock, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { localizedName } from "@/utils/libraryHelpers";
import "@/styles/identity.css";

/*
 * The recommendation is the one piece of the dashboard that should feel like
 * an invitation, so it takes a full surya fill — the warming channel, the one
 * associated with beginning. Everything else on the page stays on paper.
 */
const HeroCard = ({ sequence, reason, loading }) => {
	const navigate = useNavigate();
	const { t, lang } = useLanguage();

	if (loading) {
		return <div data-identity="next" className="ink-block skeleton h-52" />;
	}

	if (!sequence) {
		return (
			<section
				data-identity="next"
				aria-label={t("dashboard.welcome_title")}
				className="ink-block p-6"
			>
				<h2 className="display text-[1.8rem]">
					{t("dashboard.welcome_title")}
				</h2>
				<p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
					{t("hero.welcome_hint")}
				</p>
				<button
					type="button"
					onClick={() => navigate("/library")}
					className="ink-block ink-block--press mt-5 px-5 py-2.5 text-sm font-bold"
					style={{
						background: "var(--surya)",
						color: "var(--on-fill)",
						cursor: "pointer",
					}}
				>
					{t("hero.explore")}
				</button>
			</section>
		);
	}

	const recommendedMinutes = Number(sequence.estimatedDuration?.recommended);
	const sequenceName = localizedName(sequence, lang);

	const startPractice = () => {
		const params = new URLSearchParams({
			type: "vk_sequence",
			seq: sequence._id,
		});
		if (Number.isFinite(recommendedMinutes) && recommendedMinutes > 0) {
			params.set("minutes", String(Math.round(recommendedMinutes)));
		}
		navigate(`/start-practice?${params.toString()}`);
	};

	return (
		<article
			data-identity="next"
			aria-labelledby="hero-recommended-title"
			className="ink-block p-6"
			style={{ background: "var(--surya)", color: "var(--on-fill)" }}
		>
			<p className="text-sm font-bold">{t("dashboard.recommended")}</p>
			{reason && (
				<p className="mt-1 text-[0.8rem]" style={{ opacity: 0.75 }}>
					{reason}
				</p>
			)}

			<h2 id="hero-recommended-title" className="display mt-3 text-[2rem]">
				{sequenceName}
			</h2>
			<p className="mt-1 text-sm italic" style={{ opacity: 0.8 }}>
				{sequence.sanskritName}
			</p>

			<dl className="m-0 mt-4 flex flex-wrap items-center gap-2">
				{sequence.estimatedDuration?.recommended && (
					<div
						className="flex items-center gap-1.5 px-3 py-1"
						style={{
							border: "var(--ink-width) solid var(--on-fill)",
							borderRadius: "var(--radius-block)",
						}}
					>
						<Clock size={13} aria-hidden="true" />
						<dt className="sr-only">
							{t("library.stat_duration", "Duration")}
						</dt>
						<dd className="m-0 text-xs font-bold">
							{sequence.estimatedDuration.recommended} min
						</dd>
					</div>
				)}
				<div
					className="flex items-center gap-1.5 px-3 py-1"
					style={{
						border: "var(--ink-width) solid var(--on-fill)",
						borderRadius: "var(--radius-block)",
					}}
				>
					<Dumbbell size={13} aria-hidden="true" />
					<dt className="sr-only">{t("library.stat_level", "Level")}</dt>
					<dd className="m-0 text-xs font-bold">
						{/*
						 * Dificultad, no nivel: el titulo de la tarjeta ya termina
						 * en "- Nivel 1", asi que repetirlo aqui no aporta nada.
						 */}
						{t(`library.${sequence.difficulty}`, sequence.difficulty)}
					</dd>
				</div>
			</dl>

			<div className="mt-5 flex flex-wrap items-center gap-4">
				<button
					type="button"
					onClick={startPractice}
					className="ink-block ink-block--press display px-6 py-2.5 text-[1.05rem]"
					style={{
						// Relleno claro, no de tinta. El borde y la sombra del
						// ink-block son de color tinta, asi que si el fondo del
						// boton tambien fuera tinta el contorno desapareceria y
						// el boton se veria como una mancha negra sobre negro.
						background: "var(--paper)",
						color: "var(--ink)",
						cursor: "pointer",
					}}
				>
					{t("hero.start")}
				</button>
				<button
					type="button"
					onClick={() => navigate(`/library/sequence/${sequence._id}`)}
					aria-label={`${t("hero.view_details", "View details")}: ${sequenceName}`}
					className="text-sm font-bold underline"
					style={{ cursor: "pointer" }}
				>
					{t("hero.view_details", "View details")}
				</button>
			</div>
		</article>
	);
};

export default HeroCard;

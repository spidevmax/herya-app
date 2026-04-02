import { useLanguage } from "@/context/LanguageContext";

export default function HyraxGlyph({
	size = 96,
	background = "var(--color-tone-warning-bg)",
	body = "var(--color-text-primary)",
	accent = "var(--color-primary)",
	outline = "var(--color-text-primary)",
	className = "",
}) {
	const { t } = useLanguage();
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 120 120"
			className={className}
			role="img"
			aria-label={t("ui.hyrax_illustration")}
		>
			<title>{t("ui.hyrax_illustration")}</title>
			<rect x="4" y="4" width="112" height="112" rx="24" fill={background} />
			<ellipse
				cx="59"
				cy="88"
				rx="30"
				ry="8"
				fill="var(--color-text-primary)"
				opacity="0.18"
			/>

			<path
				d="M35 73 C35 53, 47 45, 65 45 C80 45, 89 56, 89 70 C89 83, 81 93, 65 93 C49 93, 35 86, 35 73"
				fill={body}
				stroke={outline}
				strokeWidth="3"
			/>
			<ellipse
				cx="80"
				cy="63"
				rx="17"
				ry="14"
				fill={body}
				stroke={outline}
				strokeWidth="3"
			/>
			<ellipse
				cx="83"
				cy="64"
				rx="9"
				ry="7"
				fill="var(--color-surface-card)"
				stroke={outline}
				strokeWidth="2"
			/>
			<circle cx="85" cy="64" r="2.8" fill={outline} />
			<circle cx="88" cy="61" r="1.2" fill="var(--color-surface-card)" />

			<path
				d="M70 54 L73 45 L79 54"
				fill={accent}
				stroke={outline}
				strokeWidth="2.5"
				strokeLinejoin="round"
			/>
			<path
				d="M83 49 L88 41 L93 49"
				fill={accent}
				stroke={outline}
				strokeWidth="2.5"
				strokeLinejoin="round"
			/>

			<circle
				cx="60"
				cy="75"
				r="5.5"
				fill={accent}
				stroke={outline}
				strokeWidth="2.5"
			/>

			<rect x="50" y="91" width="7" height="10" rx="2" fill={outline} />
			<rect x="64" y="91" width="7" height="10" rx="2" fill={outline} />

			<path
				d="M94 71 C98 74, 100 79, 96 84"
				fill="none"
				stroke={outline}
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<rect
				x="4"
				y="4"
				width="112"
				height="112"
				rx="24"
				fill="none"
				stroke={outline}
				strokeWidth="3"
			/>
		</svg>
	);
}

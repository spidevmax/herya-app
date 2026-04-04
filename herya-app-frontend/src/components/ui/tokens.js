// ─ Herya Design Tokens ─────────────────────────────────────────────────
// Centraliza colores, sombras y espaciado para UI components
// Facilita cambios globales y reduce hardcoding de hex values

export const colors = {
	primary: {
		base: "var(--color-primary)",
		dark: "var(--color-accent)",
		light: "var(--color-primary-light)",
		hover: "var(--color-accent)",
		hover_bg: "var(--color-primary)",
	},
	secondary: {
		base: "var(--color-secondary)",
		dark: "var(--color-secondary-dark)",
		hover: "var(--color-secondary-dark)",
	},
	accent: {
		base: "var(--color-accent)",
		hover: "var(--color-accent-dark)",
	},
	text: {
		primary: "var(--color-text-primary)",
		secondary: "var(--color-text-secondary)",
		muted: "var(--color-text-muted)",
	},
	border: {
		base: "var(--color-border)",
		light: "var(--color-border-soft)",
	},
	surface: {
		base: "var(--color-surface)",
		white: "var(--color-surface-card)",
		light: "var(--color-surface-secondary)",
		elevated: "var(--color-surface-elevated)",
	},
	states: {
		disabled_opacity: 0.5,
	},
};

export const shadows = {
	card: "var(--shadow-card)",
	card_hover: "var(--shadow-card-hover)",
	button: "var(--shadow-card)",
	button_secondary: "var(--shadow-card)",
	button_accent: "var(--shadow-card)",
};

export const radius = {
	sm: "12px",
	md: "16px",
	lg: "20px",
	pill: "999px",
};

export const spacingTokens = {
	xs: "0.375rem",
	sm: "0.5rem",
	md: "1rem",
	lg: "1.5rem",
	xl: "2rem",
};

// Button variant definitions
export const buttonVariants = {
	primary: {
		bg: colors.primary.base,
		text: colors.surface.white,
		shadow: shadows.button,
		hover_bg: colors.primary.hover,
		active: "scale-95",
	},
	secondary: {
		bg: colors.secondary.base,
		text: colors.text.primary,
		shadow: shadows.button_secondary,
		hover_bg: colors.secondary.hover,
		active: "scale-95",
	},
	accent: {
		bg: colors.accent.base,
		text: colors.surface.white,
		shadow: shadows.button_accent,
		hover_bg: colors.accent.hover,
		active: "scale-95",
	},
	ghost: {
		bg: "transparent",
		text: colors.primary.base,
		shadow: "none",
		hover_bg: `${colors.primary.base}/10`,
		active: "scale-95",
	},
	outline: {
		bg: colors.surface.white,
		text: colors.text.primary,
		shadow: "none",
		border: colors.border.light,
		border_hover: colors.primary.base,
		border_active: `${colors.primary.base}`,
		text_hover: colors.accent.base,
		active: "scale-95",
	},
};

export const chipColors = {
	teal: colors.primary.base,
	yellow: colors.secondary.base,
	sage: colors.accent.base,
};

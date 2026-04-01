const nodemailer = require("nodemailer");

const parseBoolean = (value) => `${value}`.toLowerCase() === "true";

const normalizeLocale = (value) => {
	const short = `${value || "es"}`.toLowerCase().split("-")[0];
	return short === "en" ? "en" : "es";
};

const escapeHtml = (value = "") =>
	`${value}`
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&#39;");

const RESET_EMAIL_COPY = {
	es: {
		subject: "Restablece tu contraseña de Herya",
		title: "Restablece tu contraseña",
		greeting: "Hola {name},",
		body: "Recibimos una solicitud para restablecer tu contraseña de Herya.",
		cta: "Crear nueva contraseña",
		expires: "Este enlace es válido durante 30 minutos.",
		disclaimer:
			"Si no solicitaste este cambio, puedes ignorar este mensaje con tranquilidad.",
		brandLine: "Respira, practica y vuelve a tu centro.",
	},
	en: {
		subject: "Reset your Herya password",
		title: "Reset your password",
		greeting: "Hi {name},",
		body: "We received a request to reset your Herya password.",
		cta: "Create new password",
		expires: "This link is valid for 30 minutes.",
		disclaimer:
			"If you did not request this change, you can safely ignore this email.",
		brandLine: "Breathe, practice, and return to your center.",
	},
};

const buildPasswordResetEmail = ({ locale, name, resetUrl }) => {
	const selectedLocale = normalizeLocale(locale);
	const copy = RESET_EMAIL_COPY[selectedLocale];
	const safeName = escapeHtml(
		name || (selectedLocale === "es" ? "amiga" : "friend"),
	);
	const safeResetUrl = escapeHtml(resetUrl);

	const text = [
		copy.greeting.replace(
			"{name}",
			name || (selectedLocale === "es" ? "amiga" : "friend"),
		),
		"",
		copy.body,
		"",
		`${copy.cta}: ${resetUrl}`,
		"",
		copy.expires,
		copy.disclaimer,
	].join("\n");

	const html = `
		<div style="margin:0;padding:24px;background:linear-gradient(135deg,#f9f4e5 0%,#eaf1ff 100%);font-family:'Trebuchet MS',Verdana,sans-serif;color:#3d2a1a;">
			<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;margin:0 auto;background:#fff8ea;border:1px solid #eedfbe;border-radius:20px;box-shadow:0 18px 44px rgba(70,52,23,0.16);overflow:hidden;">
				<tr>
					<td style="padding:28px 28px 8px;text-align:center;">
						<div style="font-size:40px;line-height:1;">🧘</div>
						<h1 style="margin:12px 0 4px;font-size:30px;letter-spacing:1.5px;color:#7a4b22;">HERYA</h1>
						<p style="margin:0 0 8px;font-size:13px;color:#8f6a47;">${copy.brandLine}</p>
					</td>
				</tr>
				<tr>
					<td style="padding:8px 28px 30px;">
						<h2 style="margin:0 0 12px;font-size:22px;color:#332317;">${copy.title}</h2>
						<p style="margin:0 0 12px;font-size:16px;color:#4f3a29;">${copy.greeting.replace("{name}", safeName)}</p>
						<p style="margin:0 0 22px;font-size:15px;color:#5f4832;">${copy.body}</p>
						<p style="margin:0 0 22px;text-align:center;">
							<a href="${safeResetUrl}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:linear-gradient(90deg,#f6a408 0%,#dc8c07 100%);color:#ffffff;text-decoration:none;font-weight:700;box-shadow:0 9px 24px rgba(229,143,8,0.35);">${copy.cta}</a>
						</p>
						<p style="margin:0 0 8px;font-size:13px;color:#7f6246;">${copy.expires}</p>
						<p style="margin:0;font-size:13px;color:#7f6246;">${copy.disclaimer}</p>
					</td>
				</tr>
			</table>
		</div>
	`;

	return {
		subject: copy.subject,
		text,
		html,
	};
};

const getSmtpConfig = () => {
	const host = process.env.SMTP_HOST;
	const port = Number(process.env.SMTP_PORT || 587);
	const user = process.env.SMTP_USER;
	const pass = process.env.SMTP_PASS;
	const secure = parseBoolean(process.env.SMTP_SECURE || false);
	const from =
		process.env.SMTP_FROM || `Herya <${user || "no-reply@herya.app"}>`;

	return {
		host,
		port,
		secure,
		from,
		auth: user && pass ? { user, pass } : undefined,
	};
};

const isSmtpConfigured = () => {
	const { host, auth } = getSmtpConfig();
	return Boolean(host && auth?.user && auth?.pass);
};

const getTransporter = () => {
	const config = getSmtpConfig();
	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: config.auth,
	});
};

const sendPasswordResetEmail = async ({
	to,
	name,
	resetUrl,
	locale = "es",
}) => {
	const transporter = getTransporter();
	const { from } = getSmtpConfig();
	const payload = buildPasswordResetEmail({ locale, name, resetUrl });

	return transporter.sendMail({
		from,
		to,
		subject: payload.subject,
		text: payload.text,
		html: payload.html,
	});
};

module.exports = {
	isSmtpConfigured,
	sendPasswordResetEmail,
};

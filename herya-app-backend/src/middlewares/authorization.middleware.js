const User = require("../models/User.model");
const { verifyToken } = require("../../utils/token");
const { createError } = require("../../utils/createError");

/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado
 */
const authenticateToken = (allowedRoles = []) => {
	return async (req, res, next) => {
		try {
			const token = req.headers.authorization?.replace("Bearer ", "");
			if (!token) {
				return res
					.status(401)
					.json({ error: "No autorizado: token no proporcionado" });
			}

			const decoded = verifyToken(token);
			const user = await User.findById(decoded.id);
			if (!user) {
				return res
					.status(401)
					.json({ error: "Token inválido o usuario no encontrado" });
			}

			req.user = user;

			// Verificar roles si se especifican
			if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
				return res
					.status(403)
					.json({ error: "Acceso denegado: permisos insuficientes" });
			}

			next();
		} catch (error) {
			return res
				.status(401)
				.json({ error: "Token inválido o sesión expirada" });
		}
	};
};

/**
 * Middleware para verificar que el usuario es admin
 * Se usa con authenticateToken previamente
 */
const isAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		return res
			.status(403)
			.json({ error: "Acceso denegado: solo administradores" });
	}
	next();
};

/**
 * Middleware para verificar que el usuario es el dueño del recurso
 * O que es admin
 */
const isOwnerOrAdmin = (fieldName = "user") => {
	return (req, res, next) => {
		const resourceOwnerId = req.resource?.[fieldName]?.toString();
		const userId = req.user._id.toString();
		const isAdmin = req.user.role === "admin";

		if (!isAdmin && resourceOwnerId !== userId) {
			return res.status(403).json({
				error:
					"Acceso denegado: solo el propietario o administrador puede realizar esta acción",
			});
		}
		next();
	};
};

module.exports = { authenticateToken, isAdmin, isOwnerOrAdmin };

import api from "./axios";

export const login = (data) => api.post("/auth/login", data);
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");
export const logout = () => api.post("/auth/logout");
export const requestPasswordReset = (data) =>
	api.post("/auth/request-password-reset", data);
export const resetPassword = (data) => api.post("/auth/reset-password", data);

import api from "./axios";

export const getSessions = (params) => api.get("/sessions", { params });
export const getSessionById = (id) => api.get(`/sessions/${id}`);
export const createSession = (data) => api.post("/sessions", data);
export const updateSession = (id, data) => api.put(`/sessions/${id}`, data);
export const deleteSession = (id) => api.delete(`/sessions/${id}`);
export const getSessionStats = () => api.get("/sessions/stats");

// Guided practice flow
export const getActiveSession = () => api.get("/sessions/active/current");
export const startSessionTimer = (id) => api.post(`/sessions/${id}/start`);
export const pauseSessionTimer = (id) => api.post(`/sessions/${id}/pause`);
export const advanceSessionBlock = (id, direction) =>
	api.post(`/sessions/${id}/advance-block`, { direction });
export const completeGuidedSession = (id, data) =>
	api.post(`/sessions/${id}/complete`, data);
export const abandonSession = (id, data = {}) =>
	api.post(`/sessions/${id}/abandon`, data);
export const getPracticeAnalytics = () =>
	api.get("/sessions/analytics/practice");
export const getTutorAnalytics = (params) =>
	api.get("/sessions/analytics/tutor", { params });

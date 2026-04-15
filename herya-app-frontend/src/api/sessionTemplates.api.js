import api from "./axios";

export const getSessionTemplates = (params) =>
	api.get("/session-templates", { params });
export const getSessionTemplateById = (id) =>
	api.get(`/session-templates/${id}`);
export const createSessionTemplate = (data) =>
	api.post("/session-templates", data);
export const updateSessionTemplate = (id, data) =>
	api.put(`/session-templates/${id}`, data);
export const useSessionTemplate = (id) =>
	api.post(`/session-templates/${id}/use`);
export const deleteSessionTemplate = (id) =>
	api.delete(`/session-templates/${id}`);

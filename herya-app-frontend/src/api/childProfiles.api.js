import api from "./axios";

export const getChildProfiles = () => api.get("/child-profiles");
export const getChildProfileById = (id) => api.get(`/child-profiles/${id}`);
export const createChildProfile = (data) => api.post("/child-profiles", data);
export const updateChildProfile = (id, data) =>
	api.put(`/child-profiles/${id}`, data);
export const deleteChildProfile = (id) => api.delete(`/child-profiles/${id}`);

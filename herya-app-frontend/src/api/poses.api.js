import api from "./axios";

export const getPoses = (params) => api.get("/poses", { params });
export const searchPoses = (q, params) =>
	api.get("/poses/search", { params: { q, ...params } });
export const getPosesByCategory = (category, params) =>
	api.get(`/poses/category/${category}`, { params });
export const getPosesByFamily = (family) => api.get(`/poses/family/${family}`);
export const getPoseById = (id) => api.get(`/poses/${id}`);
export const getRelatedPoses = (id) => api.get(`/poses/${id}/related`);

import api from "./axios";

export const getSequences = (params) => api.get("/sequences", { params });
export const getSequenceById = (id) => api.get(`/sequences/${id}`);
export const getSequencesByFamily = (family, params) =>
	api.get(`/sequences/family/${family}`, { params });
export const getRecommendedSequence = () =>
	api.get("/sequences/stats/recommended");
export const searchSequences = (q) =>
	api.get("/sequences/search", { params: { q } });

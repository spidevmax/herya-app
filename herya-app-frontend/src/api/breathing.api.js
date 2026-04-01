import api from "./axios";

export const getBreathingPatterns = (params) => api.get("/breathing-patterns", { params });
export const searchBreathingPatterns = (q) => api.get("/breathing-patterns/search", { params: { q } });
export const getRecommendedBreathing = (params) => api.get("/breathing-patterns/recommended", { params });
export const getBreathingProgression = () => api.get("/breathing-patterns/progression");
export const getByTechnique = (technique, params) => api.get(`/breathing-patterns/technique/${technique}`, { params });
export const getBreathingPatternById = (id) => api.get(`/breathing-patterns/${id}`);

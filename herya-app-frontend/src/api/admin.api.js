import api from "./axios";

// Analytics
export const getAnalyticsDashboard = () => api.get("/admin/analytics/dashboard");
export const getUserAnalytics = (userId) => api.get(`/admin/analytics/users/${userId}`);

// User management
export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const changeUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

// Pose management
export const createPose = (data) => api.post("/admin/poses", data);
export const updatePose = (id, data) => api.put(`/admin/poses/${id}`, data);
export const deletePose = (id) => api.delete(`/admin/poses/${id}`);

// Sequence management
export const createSequence = (data) => api.post("/admin/sequences", data);
export const updateSequence = (id, data) => api.put(`/admin/sequences/${id}`, data);
export const deleteSequence = (id) => api.delete(`/admin/sequences/${id}`);

// Breathing pattern management
export const createBreathingPattern = (data) => api.post("/admin/breathing-patterns", data);
export const updateBreathingPattern = (id, data) => api.put(`/admin/breathing-patterns/${id}`, data);
export const deleteBreathingPattern = (id) => api.delete(`/admin/breathing-patterns/${id}`);

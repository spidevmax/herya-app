import api from "./axios";

export const getMe = () => api.get("/users/me");
export const updateProfile = (data) => api.put("/users/me", data);
export const updateProfileImage = (formData) =>
	api.put("/users/me/image", formData, {
		headers: { "Content-Type": "multipart/form-data" },
	});
export const deleteProfileImage = () => api.delete("/users/me/image");
export const getUserStats = () => api.get("/users/me/stats");

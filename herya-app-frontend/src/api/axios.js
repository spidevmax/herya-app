import axios from "axios";
import { API_BASE } from "@/utils/constants";

const api = axios.create({
	baseURL: API_BASE,
	withCredentials: false,
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("herya_token");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// On 401 redirect to login
api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response?.status === 401) {
			localStorage.removeItem("herya_token");
			localStorage.removeItem("herya_user");
			window.location.href = "/login";
		}
		return Promise.reject(err);
	},
);

export default api;

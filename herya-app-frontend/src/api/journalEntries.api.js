import api from "./axios";

export const getJournalEntries = (params) =>
	api.get("/journal-entries", { params });
export const getJournalEntryById = (id) => api.get(`/journal-entries/${id}`);
export const createJournalEntry = (data) => api.post("/journal-entries", data);
export const updateJournalEntry = (id, data) =>
	api.put(`/journal-entries/${id}`, data);
export const deleteJournalEntry = (id) => api.delete(`/journal-entries/${id}`);
export const getJournalStats = () => api.get("/journal-entries/digital-garden");

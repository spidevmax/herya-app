import api from "./axios";

export const getJournalEntries = (params) =>
	api.get("/journal-entries", { params });
export const getJournalEntryById = (id) => api.get(`/journal-entries/${id}`);
export const createJournalEntry = (data) => api.post("/journal-entries", data);
export const updateJournalEntry = (id, data) =>
	api.put(`/journal-entries/${id}`, data);
export const completeJournalEntry = (id, data) =>
	api.patch(`/journal-entries/${id}/complete`, data);
export const deleteJournalEntry = (id) => api.delete(`/journal-entries/${id}`);

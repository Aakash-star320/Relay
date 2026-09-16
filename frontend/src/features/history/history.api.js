import { request } from "../../shared/api/client.js";

export function loadHistory(filters = {}) {
	const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
	return request(`/history${query.size ? `?${query}` : ""}`);
}

export function loadHistoryEntry(historyId) {
	return request(`/history/${historyId}`);
}

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function createKeyValueRow() {
	return { id: crypto.randomUUID(), key: "", value: "", enabled: true };
}

export function createInitialRequestDraft() {
	return {
		method: "GET",
		url: "http://127.0.0.1:8000/demo/orders",
		params: [],
		headers: [{ id: crypto.randomUUID(), key: "Accept", value: "application/json", enabled: true }],
		body: { type: "none", content: "" },
		auth: { type: "none", token: "", username: "", password: "", key: "", value: "", addTo: "header" },
		assertions: [],
		extractions: [],
	};
}

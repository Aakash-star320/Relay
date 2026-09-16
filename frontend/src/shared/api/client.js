const baseUrl = import.meta.env.VITE_API_URL || "/api/v1";
const SESSION_STORAGE_KEY = "relay-session-token";

let sessionToken = localStorage.getItem(SESSION_STORAGE_KEY) || "";

export function setSessionToken(token) {
	sessionToken = token || "";
	if (sessionToken) localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
	else localStorage.removeItem(SESSION_STORAGE_KEY);
}

export const hasSessionToken = () => Boolean(sessionToken);

export async function request(path, options = {}) {
	const response = await fetch(`${baseUrl}${path}`, {
		...options,
		headers: {
			...(options.body ? { "Content-Type": "application/json" } : {}),
			...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
			...options.headers,
		},
	});

	if (response.status === 204) return null;

	const contentType = response.headers.get("content-type") || "";
	const payload = contentType.includes("application/json") ? await response.json() : null;

	if (!response.ok) {
		const code = payload?.error?.code;
		const message = payload?.error?.message || `Relay returned an unexpected ${response.status} response.`;
		if (response.status === 401 && ["AUTH_REQUIRED", "INVALID_TOKEN", "ACCOUNT_UNAVAILABLE"].includes(code)) {
			setSessionToken("");
			window.dispatchEvent(new CustomEvent("relay-session-expired", { detail: message }));
		}
		throw new Error(message);
	}

	if (!payload || !("data" in payload)) throw new Error("Relay returned an invalid response.");
	return payload.data;
}

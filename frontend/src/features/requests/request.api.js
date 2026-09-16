import { request } from "../../shared/api/client.js";

export function executeRequest(draft) {
	return request("/executions", { method: "POST", body: JSON.stringify(draft) });
}

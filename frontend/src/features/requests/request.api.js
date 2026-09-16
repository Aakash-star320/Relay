import { request } from "../../shared/api/client.js";

export function executeRequest(draft, environmentId, collectionId, executionId) {
	return request("/executions", { method: "POST", body: JSON.stringify({ ...draft, environmentId, collectionId, executionId }) });
}

export function cancelExecution(executionId) {
	return request(`/executions/${executionId}`, { method: "DELETE" });
}

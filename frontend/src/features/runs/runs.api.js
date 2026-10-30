import { request } from "../../shared/api/client.js";
export const startCollectionRun = (collectionId, stopOnFailure, environmentId) => request("/runs", { method: "POST", body: JSON.stringify({ collectionId, stopOnFailure, environmentId: environmentId || null }) });
export const getCollectionRun = (runId) => request(`/runs/${runId}`);
export const cancelCollectionRun = (runId) => request(`/runs/${runId}`, { method: "DELETE" });

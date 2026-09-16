import { request } from "../../shared/api/client.js";
export const loadWorkspace = () => request("/collections");
export const createCollection = (name) => request("/collections", { method: "POST", body: JSON.stringify({ name }) });
export const createSavedRequest = (savedRequest) => request("/collections/requests", { method: "POST", body: JSON.stringify(savedRequest) });
export const updateSavedRequest = (requestId, savedRequest) => request(`/collections/requests/${requestId}`, { method: "PATCH", body: JSON.stringify(savedRequest) });

import { request } from "../../shared/api/client.js";
export const loadEnvironments = () => request("/environments");
export const createEnvironment = (environment) => request("/environments", { method: "POST", body: JSON.stringify(environment) });
export const updateEnvironment = (environmentId, environment) => request(`/environments/${environmentId}`, { method: "PATCH", body: JSON.stringify(environment) });
export const deleteEnvironment = (environmentId) => request(`/environments/${environmentId}`, { method: "DELETE" });

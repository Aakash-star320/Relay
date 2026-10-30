import { ApiCollection } from "../collections/collection.model.js";
import { Environment } from "../environments/environment.model.js";
import { resolveVariables } from "../environments/variable-resolution.service.js";
import { AppError } from "../../shared/errors/app-error.js";

function resolveAuth(auth, variables) {
	if (!auth) return undefined;
	return Object.fromEntries(Object.entries(auth).map(([key, value]) => [key, typeof value === "string" ? resolveVariables(value, variables) : value]));
}

function resolveRows(rows, variables) {
	return rows.map((row) => ({ ...row, value: resolveVariables(row.value, variables) }));
}

// Run values override environment values, but are never persisted outside their run.
export async function prepareExecutionDraft(accountId, draft, runVariables = new Map()) {
	let environmentVariables = new Map();
	if (draft.environmentId) {
		const environment = await Environment.findOne({ _id: draft.environmentId, accountId }).lean();
		if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "Selected environment was not found.");
		environmentVariables = new Map(environment.variables.map((variable) => [variable.key, variable.value]));
	}
	const collection = draft.collectionId ? await ApiCollection.findOne({ _id: draft.collectionId, accountId }).lean() : null;
	if (draft.collectionId && !collection) throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found.");
	const variables = new Map([...environmentVariables, ...runVariables]);
	const selectedAuth = draft.auth?.type === "inherit" ? collection?.auth : draft.auth;
	return {
		...draft,
		auth: resolveAuth(selectedAuth, variables),
		url: resolveVariables(draft.url, variables),
		params: resolveRows(draft.params, variables),
		headers: resolveRows(draft.headers, variables),
		body: { ...draft.body, content: resolveVariables(draft.body.content, variables) },
	};
}

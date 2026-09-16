import { executionRequestSchema } from "./execution.schema.js";
import { cancelExecution, executeRequest } from "./execution.service.js";
import { Environment } from "../environments/environment.model.js";
import { AppError } from "../../shared/errors/app-error.js";
import { resolveVariables } from "../environments/variable-resolution.service.js";
import { ApiCollection } from "../collections/collection.model.js";
import { recordExecutionHistory } from "../history/history.service.js";

export async function execute(request, response, next) {
	try {
		const draft = executionRequestSchema.parse(request.body);
		let variables = new Map();
		if (draft.environmentId) { const environment = await Environment.findOne({ _id: draft.environmentId, accountId: String(request.account._id) }).lean(); if (!environment) throw new AppError(404, "ENVIRONMENT_NOT_FOUND", "Selected environment was not found."); variables = new Map(environment.variables.map((variable) => [variable.key, variable.value])); }
		const collection = draft.collectionId ? await ApiCollection.findOne({ _id: draft.collectionId, accountId: String(request.account._id) }).lean() : null;
		const selectedAuth = draft.auth?.type === "inherit" ? collection?.auth : draft.auth;
		const resolvedAuth = selectedAuth ? Object.fromEntries(Object.entries(selectedAuth).map(([key, value]) => [key, typeof value === "string" ? resolveVariables(value, variables) : value])) : undefined;
		const resolved = { ...draft, auth: resolvedAuth, url: resolveVariables(draft.url, variables), params: draft.params.map((row) => ({ ...row, value: resolveVariables(row.value, variables) })), headers: draft.headers.map((row) => ({ ...row, value: resolveVariables(row.value, variables) })), body: { ...draft.body, content: resolveVariables(draft.body.content, variables) } };
		const result = await executeRequest(String(request.account._id), resolved);
		await recordExecutionHistory(String(request.account._id), draft, result);
		response.json({ data: result });
	} catch (error) { next(error); }
}

export function cancel(request, response, next) {
	try {
		const { executionId } = request.params;
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(executionId)) {
			throw new AppError(400, "INVALID_EXECUTION_ID", "Execution ID must be a UUID.");
		}
		response.json({ data: { cancelled: cancelExecution(String(request.account._id), executionId) } });
	} catch (error) { next(error); }
}

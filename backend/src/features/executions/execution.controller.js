import { executionRequestSchema } from "./execution.schema.js";
import { cancelExecution, executeRequest } from "./execution.service.js";
import { recordExecutionHistory } from "../history/history.service.js";
import { evaluateAssertions } from "../assertions/assertion.service.js";
import { prepareExecutionDraft } from "./execution-preparation.service.js";

export async function execute(request, response, next) {
	try {
		const draft = executionRequestSchema.parse(request.body);
		const resolved = await prepareExecutionDraft(String(request.account._id), draft);
		const result = await executeRequest(String(request.account._id), resolved);
		result.assertions = evaluateAssertions(draft.assertions, result);
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

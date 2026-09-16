import { executeHttpRequest } from "./http-execution.client.js";
import { releaseExecutionSlot, reserveExecutionSlot } from "./execution-limits.service.js";

const activeExecutions = new Map();

function executionKey(accountId, executionId) {
	return `${accountId}:${executionId}`;
}

export async function executeRequest(accountId, draft) {
	const executionId = draft.executionId;
	reserveExecutionSlot(accountId, executionId);
	const abortController = new AbortController();
	activeExecutions.set(executionKey(accountId, executionId), abortController);
	try {
		return { executionId, ...(await executeHttpRequest(draft, abortController)) };
	} finally {
		activeExecutions.delete(executionKey(accountId, executionId));
		releaseExecutionSlot(accountId, executionId);
	}
}

export function cancelExecution(accountId, executionId) {
	const abortController = activeExecutions.get(executionKey(accountId, executionId));
	if (!abortController || abortController.signal.aborted) return false;
	abortController.abort("cancelled");
	return true;
}

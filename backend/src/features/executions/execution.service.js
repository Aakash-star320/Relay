import crypto from "crypto";
import { executeHttpRequest } from "./http-execution.client.js";
import { releaseExecutionSlot, reserveExecutionSlot } from "./execution-limits.service.js";

export async function executeRequest(accountId, draft) {
	const executionId = crypto.randomUUID();
	reserveExecutionSlot(accountId, executionId);
	try {
		return { executionId, ...(await executeHttpRequest(draft)) };
	} finally {
		// Each execution owns a distinct Set entry, so simultaneous completions each release one slot.
		releaseExecutionSlot(accountId, executionId);
	}
}

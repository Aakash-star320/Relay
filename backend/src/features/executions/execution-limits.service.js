import { AppError } from "../../shared/errors/app-error.js";

const MAX_ACTIVE_EXECUTIONS = 5;
const REQUEST_WINDOW_MS = 60_000;
const MAX_REQUEST_STARTS_PER_WINDOW = 30;

const accountLimits = new Map();

function getAccountLimit(accountId) {
	let accountLimit = accountLimits.get(accountId);
	if (!accountLimit) {
		accountLimit = { activeExecutionIds: new Set(), requestStartTimes: [] };
		accountLimits.set(accountId, accountLimit);
	}
	return accountLimit;
}

function removeExpiredRequestStarts(requestStartTimes, now) {
	const oldestAllowedTime = now - REQUEST_WINDOW_MS;
	while (requestStartTimes.length > 0 && requestStartTimes[0] <= oldestAllowedTime) requestStartTimes.shift();
}

/**
 * This synchronous section is deliberately before any await. Node processes one
 * event-loop callback at a time, so two completions or starts cannot lose a count.
 */
export function reserveExecutionSlot(accountId, executionId) {
	const now = Date.now();
	const accountLimit = getAccountLimit(accountId);
	removeExpiredRequestStarts(accountLimit.requestStartTimes, now);

	if (accountLimit.activeExecutionIds.size >= MAX_ACTIVE_EXECUTIONS) {
		throw new AppError(429, "ACTIVE_EXECUTION_LIMIT", `You can run up to ${MAX_ACTIVE_EXECUTIONS} requests at once.`);
	}
	if (accountLimit.requestStartTimes.length >= MAX_REQUEST_STARTS_PER_WINDOW) {
		throw new AppError(429, "EXECUTION_RATE_LIMIT", `You can start up to ${MAX_REQUEST_STARTS_PER_WINDOW} requests per minute.`);
	}

	accountLimit.activeExecutionIds.add(executionId);
	accountLimit.requestStartTimes.push(now);
}

export function releaseExecutionSlot(accountId, executionId) {
	const accountLimit = accountLimits.get(accountId);
	if (!accountLimit) return;
	accountLimit.activeExecutionIds.delete(executionId);
	if (accountLimit.activeExecutionIds.size === 0 && accountLimit.requestStartTimes.length === 0) accountLimits.delete(accountId);
}

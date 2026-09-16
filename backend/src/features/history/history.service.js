import { AppError } from "../../shared/errors/app-error.js";
import mongoose from "mongoose";
import { createHistoryEntry, findHistoryById, findHistoryPage } from "./history.repository.js";

const SENSITIVE_NAME = /authorization|cookie|token|api[-_]?key|secret|password/i;

function redactRows(rows = []) {
	return rows.map((row) => ({ ...row, value: SENSITIVE_NAME.test(row.key) ? "[REDACTED]" : row.value }));
}

function redactHeaders(headers = {}) {
	return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, SENSITIVE_NAME.test(name) ? "[REDACTED]" : value]));
}

function createRequestSnapshot(draft) {
	return { method: draft.method, url: draft.url, params: redactRows(draft.params), headers: redactRows(draft.headers), body: { type: draft.body.type, content: draft.body.content }, authType: draft.auth?.type || "none" };
}

export async function recordExecutionHistory(accountId, draft, result) {
	const entry = { accountId, request: createRequestSnapshot(draft), outcome: result.kind, durationMs: result.durationMs };
	if (result.kind === "response") entry.response = { ...result.response, headers: redactHeaders(result.response.headers) };
	else entry.error = result.error;
	await createHistoryEntry(entry);
}

function encodeCursor(item) {
	return Buffer.from(JSON.stringify({ createdAt: item.createdAt.toISOString(), id: String(item._id) })).toString("base64url");
}

function parseCursor(cursor) {
	if (!cursor) return null;
	try {
		const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
		const createdAt = new Date(parsed.createdAt);
		if (!mongoose.isObjectIdOrHexString(parsed.id) || Number.isNaN(createdAt.getTime())) throw new Error("Invalid cursor");
		return { createdAt, id: parsed.id };
	} catch { throw new AppError(400, "INVALID_CURSOR", "The history cursor is invalid."); }
}

export async function listExecutionHistory(accountId, filters) {
	const entries = await findHistoryPage(accountId, { ...filters, cursor: parseCursor(filters.cursor) });
	const hasMore = entries.length > filters.limit;
	const items = hasMore ? entries.slice(0, -1) : entries;
	return { items, nextCursor: hasMore ? encodeCursor(items.at(-1)) : null };
}

export async function getExecutionHistory(accountId, historyId) {
	const entry = await findHistoryById(accountId, historyId);
	if (!entry) throw new AppError(404, "HISTORY_NOT_FOUND", "History entry not found.");
	return entry;
}

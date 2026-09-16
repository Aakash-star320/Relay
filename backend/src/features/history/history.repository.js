import mongoose from "mongoose";
import { ExecutionHistory } from "./execution-history.model.js";

const listFields = "request.method request.url outcome error.code response.status response.statusText response.sizeBytes durationMs createdAt";

export function createHistoryEntry(entry) {
	return ExecutionHistory.create(entry);
}

export function findHistoryPage(accountId, { cursor, limit, method, outcome }) {
	const query = { accountId };
	if (method) query["request.method"] = method;
	if (outcome) query.outcome = outcome;
	if (cursor) {
		const cursorId = new mongoose.Types.ObjectId(cursor.id);
		query.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursorId } }];
	}
	return ExecutionHistory.find(query).select(listFields).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
}

export function findHistoryById(accountId, historyId) {
	return ExecutionHistory.findOne({ _id: historyId, accountId }).lean();
}

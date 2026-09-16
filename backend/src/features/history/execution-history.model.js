import mongoose from "mongoose";

const rowSchema = new mongoose.Schema({ id: String, key: String, value: String, enabled: Boolean }, { _id: false });
const requestSnapshotSchema = new mongoose.Schema({ method: String, url: String, params: [rowSchema], headers: [rowSchema], body: { type: { type: String }, content: { type: String } }, authType: String }, { _id: false });
const responseSnapshotSchema = new mongoose.Schema({ status: Number, statusText: String, headers: { type: Map, of: String }, contentType: String, body: String, sizeBytes: Number, wasTruncated: Boolean }, { _id: false });

const executionHistorySchema = new mongoose.Schema({
	accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
	request: { type: requestSnapshotSchema, required: true },
	outcome: { type: String, enum: ["response", "error"], required: true },
	error: { code: String, message: String },
	response: responseSnapshotSchema,
	durationMs: Number,
}, { timestamps: true, versionKey: false });

// These match the paginated list and its two supported filters; more indexes would be speculative.
executionHistorySchema.index({ accountId: 1, createdAt: -1, _id: -1 });
executionHistorySchema.index({ accountId: 1, "request.method": 1, createdAt: -1, _id: -1 });
executionHistorySchema.index({ accountId: 1, outcome: 1, createdAt: -1, _id: -1 });

export const ExecutionHistory = mongoose.model("ExecutionHistory", executionHistorySchema);

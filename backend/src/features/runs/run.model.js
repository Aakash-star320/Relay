import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({ requestId: String, name: String, execution: mongoose.Schema.Types.Mixed, assertions: [mongoose.Schema.Types.Mixed], extractions: [{ id: String, path: String, variable: String, extracted: Boolean, value: String, error: String }], failed: Boolean }, { _id: false });
const collectionRunSchema = new mongoose.Schema({
	accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, collectionId: { type: mongoose.Schema.Types.ObjectId, required: true }, environmentId: { type: mongoose.Schema.Types.ObjectId, default: null },
	stopOnFailure: { type: Boolean, default: true }, cancelRequested: { type: Boolean, default: false }, status: { type: String, enum: ["running", "completed", "cancelled"], required: true }, total: { type: Number, required: true }, completed: { type: Number, default: 0 }, results: { type: [resultSchema], default: [] },
}, { timestamps: true, versionKey: false });
collectionRunSchema.index({ accountId: 1, createdAt: -1 });
export const CollectionRun = mongoose.model("CollectionRun", collectionRunSchema);

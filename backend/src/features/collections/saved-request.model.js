import mongoose from "mongoose";

const rowSchema = new mongoose.Schema({ id: String, key: String, value: String, enabled: Boolean }, { _id: false });
const savedRequestSchema = new mongoose.Schema({
	accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
	collectionId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
	name: { type: String, required: true, trim: true, maxlength: 120 },
	sortOrder: { type: Number, required: true, default: 100 },
	method: { type: String, required: true }, url: { type: String, required: true, maxlength: 8000 },
	params: { type: [rowSchema], default: [] }, headers: { type: [rowSchema], default: [] },
	body: { type: { type: String, enum: ["none", "json", "text"], default: "none" }, content: { type: String, default: "" } },
	auth: { type: { type: String, enum: ["inherit", "none", "bearer", "basic", "apiKey"], default: "inherit" }, token: { type: String, default: "" }, username: { type: String, default: "" }, password: { type: String, default: "" }, key: { type: String, default: "" }, value: { type: String, default: "" }, addTo: { type: String, enum: ["header", "query"], default: "header" } },
}, { timestamps: true, versionKey: false });
savedRequestSchema.index({ accountId: 1, collectionId: 1, sortOrder: 1 });
export const SavedRequest = mongoose.model("SavedRequest", savedRequestSchema);

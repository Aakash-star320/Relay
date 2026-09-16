import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
	accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
	name: { type: String, required: true, trim: true, maxlength: 120 },
	description: { type: String, trim: true, maxlength: 500, default: "" },
	sortOrder: { type: Number, required: true, default: 100 },
	auth: { type: { type: String, enum: ["none", "bearer", "basic", "apiKey"], default: "none" }, token: { type: String, default: "" }, username: { type: String, default: "" }, password: { type: String, default: "" }, key: { type: String, default: "" }, value: { type: String, default: "" }, addTo: { type: String, enum: ["header", "query"], default: "header" } },
}, { timestamps: true, versionKey: false });
collectionSchema.index({ accountId: 1, sortOrder: 1 });
export const ApiCollection = mongoose.model("ApiCollection", collectionSchema);

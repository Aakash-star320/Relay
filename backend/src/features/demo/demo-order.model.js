import mongoose from "mongoose";

const demoOrderSchema = new mongoose.Schema({
	reference: { type: String, required: true, trim: true, maxlength: 80, unique: true },
	customerName: { type: String, required: true, trim: true, maxlength: 120 },
	status: { type: String, required: true, enum: ["pending", "processing", "shipped", "cancelled"], default: "pending" },
	total: { type: Number, required: true, min: 0 },
}, { timestamps: true, versionKey: false });

export const DemoOrder = mongoose.model("DemoOrder", demoOrderSchema);

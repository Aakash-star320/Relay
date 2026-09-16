import mongoose from "mongoose";

const variableSchema = new mongoose.Schema({ key: { type: String, trim: true, maxlength: 120 }, value: { type: String, maxlength: 5000 } }, { _id: false });
const environmentSchema = new mongoose.Schema({ accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 120 }, variables: { type: [variableSchema], default: [] } }, { timestamps: true, versionKey: false });
environmentSchema.index({ accountId: 1, name: 1 }, { unique: true });
export const Environment = mongoose.model("Environment", environmentSchema);

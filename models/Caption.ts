import mongoose, { Schema } from "mongoose";

const CaptionSchema = new Schema(
  {
    productName: { type: String, required: true },
    price: { type: Number, default: 0 },
    oldPrice: { type: Number, default: 0 },
    category: { type: String, default: "fashion" },
    tone: { type: String, default: "casual" },
    caption: { type: String, required: true },
    engine: { type: String, default: "template" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Caption = mongoose.models.Caption ?? mongoose.model("Caption", CaptionSchema);

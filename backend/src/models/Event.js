import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 3000 },
  venue: { type: String, required: true, trim: true, maxlength: 180 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 },
  registrationCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["draft", "published", "cancelled"], default: "published" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

eventSchema.index({ status: 1, startsAt: 1 });
export default mongoose.model("Event", eventSchema);

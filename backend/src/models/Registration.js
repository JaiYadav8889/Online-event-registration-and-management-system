import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  participantName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  studentId: { type: String, trim: true, maxlength: 40, default: "" },
  ticketCode: { type: String, required: true, unique: true, index: true },
  checkedInAt: { type: Date, default: null },
  checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

registrationSchema.index({ event: 1, email: 1 }, { unique: true });
export default mongoose.model("Registration", registrationSchema);

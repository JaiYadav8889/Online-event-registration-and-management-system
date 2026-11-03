import { Router } from "express";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { protect, organizerOnly } from "../middleware/auth.js";

const router = Router();
router.post("/:eventId", async (req, res, next) => {
  try {
    const parsed = z.object({
      participantName: z.string().trim().min(2).max(100),
      email: z.string().email().max(160),
      studentId: z.string().trim().max(40).optional().default("")
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const event = await Event.findById(req.params.eventId);
    if (!event || event.status !== "published") return res.status(404).json({ message: "Event is not available" });
    const registeredCount = await Registration.countDocuments({ event: event._id });
    if (registeredCount >= event.capacity) return res.status(409).json({ message: "This event is full" });
    const ticketCode = randomBytes(18).toString("hex");
    const registration = await Registration.create({ event: event._id, ...parsed.data, ticketCode });
    const qrDataUrl = await QRCode.toDataURL(ticketCode);
    res.status(201).json({ registration: { id: registration.id, participantName: registration.participantName, email: registration.email, ticketCode, qrDataUrl } });
  } catch (err) { next(err); }
});

router.get("/manage/:eventId", protect, organizerOnly, async (req, res, next) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId }).sort({ createdAt: -1 }).lean();
    res.json({ registrations });
  } catch (err) { next(err); }
});

router.post("/check-in", protect, organizerOnly, async (req, res, next) => {
  try {
    const parsed = z.object({ ticketCode: z.string().min(12).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid ticket code is required" });
    const registration = await Registration.findOneAndUpdate(
      { ticketCode: parsed.data.ticketCode, checkedInAt: null },
      { $set: { checkedInAt: new Date(), checkedInBy: req.user.id } },
      { new: true }
    );
    if (!registration) {
      const existing = await Registration.findOne({ ticketCode: parsed.data.ticketCode });
      return res.status(existing ? 409 : 404).json({ message: existing ? "Ticket has already been checked in" : "Ticket not found" });
    }
    res.json({ message: "Check-in successful", registration });
  } catch (err) { next(err); }
});

router.get("/ticket/:ticketCode", async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ ticketCode: req.params.ticketCode }).populate("event", "title startsAt venue").lean();
    if (!registration) return res.status(404).json({ message: "Ticket not found" });
    res.json({ registration: { participantName: registration.participantName, event: registration.event, checkedInAt: registration.checkedInAt } });
  } catch (err) { next(err); }
});
export default router;

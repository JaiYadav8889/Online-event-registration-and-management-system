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
    const ticketCode = randomBytes(18).toString("hex");
    const qrDataUrl = await QRCode.toDataURL(ticketCode);
    const reservedEvent = await Event.findOneAndUpdate(
      { _id: event._id, status: "published", $expr: { $lt: ["$registrationCount", "$capacity"] } },
      { $inc: { registrationCount: 1 } },
      { new: true }
    );
    if (!reservedEvent) return res.status(409).json({ message: "This event is full or no longer accepting registrations" });
    let registration;
    try {
      registration = await Registration.create({ event: event._id, ...parsed.data, ticketCode });
    } catch (error) {
      await Event.updateOne({ _id: event._id }, { $inc: { registrationCount: -1 } });
      throw error;
    }
    res.status(201).json({ registration: { id: registration.id, participantName: registration.participantName, email: registration.email, ticketCode, qrDataUrl } });
  } catch (err) { next(err); }
});

router.get("/manage/:eventId", protect, organizerOnly, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) !== String(req.user.id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot manage this event" });
    const registrations = await Registration.find({ event: req.params.eventId }).sort({ createdAt: -1 }).lean();
    res.json({ registrations });
  } catch (err) { next(err); }
});

router.post("/check-in", protect, organizerOnly, async (req, res, next) => {
  try {
    const parsed = z.object({ ticketCode: z.string().min(12).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "A valid ticket code is required" });
    const candidate = await Registration.findOne({ ticketCode: parsed.data.ticketCode }).populate("event", "createdBy");
    if (!candidate) return res.status(404).json({ message: "Ticket not found" });
    if (String(candidate.event.createdBy) !== String(req.user.id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot check in attendees for this event" });
    const registration = await Registration.findOneAndUpdate(
      { _id: candidate._id, checkedInAt: null },
      { $set: { checkedInAt: new Date(), checkedInBy: req.user.id } },
      { new: true }
    );
    if (!registration) return res.status(409).json({ message: "Ticket has already been checked in" });
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

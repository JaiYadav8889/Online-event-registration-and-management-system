import { Router } from "express";
import { z } from "zod";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { protect, organizerOnly } from "../middleware/auth.js";

const router = Router();
const eventFields = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().max(3000).optional().default(""),
  venue: z.string().trim().min(2).max(180),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  capacity: z.coerce.number().int().min(1).max(100000),
  status: z.enum(["draft", "published", "cancelled"]).optional()
});
const eventInput = eventFields.refine(v => v.endsAt > v.startsAt, { message: "End time must be after start time" });

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.all === "true" ? {} : { status: "published" };
    const events = await Event.find(filter).sort({ startsAt: 1 }).lean();
    const ids = events.map(e => e._id);
    const counts = await Registration.aggregate([{ $match: { event: { $in: ids } } }, { $group: { _id: "$event", count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map(c => [String(c._id), c.count]));
    res.json({ events: events.map(e => ({ ...e, registered: countMap.get(String(e._id)) || 0 })) });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event || event.status !== "published") return res.status(404).json({ message: "Event not found" });
    const registered = await Registration.countDocuments({ event: event._id });
    res.json({ event: { ...event, registered } });
  } catch (err) { next(err); }
});

router.post("/", protect, organizerOnly, async (req, res, next) => {
  try {
    const parsed = eventInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const event = await Event.create({ ...parsed.data, createdBy: req.user.id });
    res.status(201).json({ event });
  } catch (err) { next(err); }
});

router.patch("/:id", protect, organizerOnly, async (req, res, next) => {
  try {
    const parsed = eventFields.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const current = await Event.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Event not found" });
    if (String(current.createdBy) !== String(req.user.id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot manage this event" });
    Object.assign(current, parsed.data);
    if (current.endsAt <= current.startsAt) return res.status(400).json({ message: "End time must be after start time" });
    await current.save();
    res.json({ event: current });
  } catch (err) { next(err); }
});

router.delete("/:id", protect, organizerOnly, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (String(event.createdBy) !== String(req.user.id) && req.user.role !== "admin") return res.status(403).json({ message: "You cannot manage this event" });
    if (await Registration.exists({ event: event._id })) {
      event.status = "cancelled";
      await event.save();
      return res.json({ message: "Event has registrations and was cancelled instead of deleted" });
    }
    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (err) { next(err); }
});
export default router;

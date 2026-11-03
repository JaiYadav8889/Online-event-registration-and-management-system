import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();
const credentials = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().email().max(160),
  password: z.string().min(8).max(100)
});

router.post("/register", async (req, res, next) => {
  try {
    const parsed = credentials.extend({ name: z.string().trim().min(2).max(80) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const { name, email, password } = parsed.data;
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email is already registered" });
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.omit({ name: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password (8+ characters)" });
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(parsed.data.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
});

router.get("/me", protect, (req, res) => res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } }));
export default router;

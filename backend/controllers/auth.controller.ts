import type { Request, Response } from "express";
import User from "../modals/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";

export const register = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }

        const user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ success: false, message: "User not found" });
            return;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid password" });
            return;
        }
        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Access token required" });
        return;
    }
    try {
        const { verifyToken } = await import("../utils/verifyToken.js");
        const decoded = await verifyToken(token);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({ success: true, user });
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const logoutUser = (_req: Request, res: Response): void => {
    res.json({ success: true, message: "Logged out" });
};
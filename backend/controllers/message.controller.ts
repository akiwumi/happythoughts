import type { Response } from "express";
import type { Server } from "socket.io";
import type { AuthRequest } from "../utils/verifyToken.js";
import Message from "../modals/Message.js";

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const messages = await Message.find()
            .populate("author", "name email avatar")
            .sort({ createdAt: 1 })
            .limit(100);
        res.json({ success: true, messages });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createMessage = async (req: AuthRequest, res: Response, io: Server): Promise<void> => {
    try {
        const { text } = req.body;
        if (!text?.trim()) {
            res.status(400).json({ message: "Message text is required" });
            return;
        }
        const msg = new Message({ text: text.trim(), author: req.user!.userId });
        await msg.save();
        await msg.populate("author", "name email avatar");
        io.emit("message:new", msg);
        res.status(201).json({ success: true, message: msg });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const editMessage = async (req: AuthRequest, res: Response, io: Server): Promise<void> => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        if (!text?.trim()) {
            res.status(400).json({ message: "Message text is required" });
            return;
        }
        const msg = await Message.findById(id);
        if (!msg) { res.status(404).json({ message: "Message not found" }); return; }
        if (msg.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized" }); return;
        }
        msg.text = text.trim();
        await msg.save();
        await msg.populate("author", "name email avatar");
        io.emit("message:updated", msg);
        res.json({ success: true, message: msg });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteMessage = async (req: AuthRequest, res: Response, io: Server): Promise<void> => {
    try {
        const { id } = req.params;
        const msg = await Message.findById(id);
        if (!msg) { res.status(404).json({ message: "Message not found" }); return; }
        if (msg.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized" }); return;
        }
        await Message.findByIdAndDelete(id);
        io.emit("message:deleted", { id });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: "Internal server error" });
    }
};

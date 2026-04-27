import { Router } from "express";
import type { Server } from "socket.io";
import { authenticateToken } from "../utils/verifyToken.js";
import { getMessages, createMessage, editMessage, deleteMessage } from "../controllers/message.controller.js";
import type { AuthRequest } from "../utils/verifyToken.js";

export default function createMessageRouter(io: Server) {
    const router = Router();

    router.get("/", authenticateToken, (req, res) => getMessages(req as AuthRequest, res));
    router.post("/", authenticateToken, (req, res) => createMessage(req as AuthRequest, res, io));
    router.put("/:id", authenticateToken, (req, res) => editMessage(req as AuthRequest, res, io));
    router.delete("/:id", authenticateToken, (req, res) => deleteMessage(req as AuthRequest, res, io));

    return router;
}

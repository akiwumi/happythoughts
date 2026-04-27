import jwt from "jsonwebtoken";
import type { Request } from "express";
import User from "../modals/User.js";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        name: string;
        email: string;
    };
}

export const verifyToken = async (token: string) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        
        // Verify user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            throw new Error("User not found");
        }
        
        return {
            userId: decoded.userId,
            name: decoded.name,
            email: decoded.email
        };
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

export const authenticateToken = async (req: AuthRequest, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    try {
        const user = await verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

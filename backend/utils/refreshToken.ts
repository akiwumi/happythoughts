import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import User from "../modals/User.js";
import { generateToken } from "./token.js";

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        // Verify refresh token (for simplicity, using same JWT secret)
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as any;
        
        // Verify user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        // Generate new access token
        const newAccessToken = generateToken(user);

        res.json({
            success: true,
            token: newAccessToken
        });

    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

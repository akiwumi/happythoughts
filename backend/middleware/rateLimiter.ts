import type { Request, Response, NextFunction } from "express";

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Max requests per window
    message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
    const { windowMs, maxRequests, message = "Too many requests, please try again later" } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || 'unknown';
        const now = Date.now();
        
        // Get or create client record
        let clientRecord = requestCounts.get(clientId);
        
        if (!clientRecord || now > clientRecord.resetTime) {
            // Reset or create new record
            clientRecord = {
                count: 1,
                resetTime: now + windowMs
            };
            requestCounts.set(clientId, clientRecord);
            return next();
        }
        
        // Check if limit exceeded
        if (clientRecord.count >= maxRequests) {
            const resetIn = Math.ceil((clientRecord.resetTime - now) / 1000);
            return res.status(429).json({
                message,
                retryAfter: resetIn
            });
        }
        
        // Increment count
        clientRecord.count++;
        requestCounts.set(clientId, clientRecord);
        next();
    };
};

// Cleanup old records periodically
setInterval(() => {
    const now = Date.now();
    for (const [clientId, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(clientId);
        }
    }
}, 60000); // Cleanup every minute

// Predefined rate limiters
export const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5,  // 5 attempts per 15 minutes
    message: "Too many authentication attempts, please try again later"
});

export const thoughtsLimiter = rateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 30,  // 30 requests per minute
    message: "Too many requests, please slow down"
});

export const createThoughtLimiter = rateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 3,  // 3 thoughts per minute
    message: "Please wait before posting another thought"
});

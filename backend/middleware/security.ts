import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";

// XSS Protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize input data
    const sanitizeInput = (obj: any): any => {
        if (typeof obj === 'string') {
            // Basic XSS protection - escape HTML characters
            return obj
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        
        if (Array.isArray(obj)) {
            return obj.map(sanitizeInput);
        }
        
        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitizeInput(value);
            }
            return sanitized;
        }
        
        return obj;
    };

    // Sanitize request body
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        const sanitizedQuery = sanitizeInput(req.query);
        Object.assign(req.query, sanitizedQuery);
    }

    next();
};

// Content Security Policy
export const cspMiddleware = helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
    },
});

// Additional security headers
export const securityHeaders = helmet({
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Input validation for thoughts
export const validateThoughtInput = (req: Request, res: Response, next: NextFunction) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ message: "Message is required" });
    }
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe\b[^>]*>/gi,
        /<object\b[^>]*>/gi,
        /<embed\b[^>]*>/gi
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(message)) {
            return res.status(400).json({ 
                message: "Message contains potentially dangerous content" 
            });
        }
    }
    
    next();
};

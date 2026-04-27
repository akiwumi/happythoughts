import type { Request, Response, NextFunction } from "express";

// Simple logging utility
export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG'
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    meta?: any;
    requestId?: string;
}

// Extend Request interface to include requestId
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

class Logger {
    private logLevel: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

    private formatLog(entry: LogEntry): string {
        const { timestamp, level, message, meta, requestId } = entry;
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        const idStr = requestId ? ` [${requestId}]` : '';
        return `[${timestamp}] ${level}${idStr}: ${message}${metaStr}`;
    }

    public writeLog(level: LogLevel, message: string, meta?: any, requestId?: string): void {
        if (this.shouldLog(level)) {
            const entry: LogEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                meta,
                ...(requestId && { requestId })
            };
            
            const formatted = this.formatLog(entry);
            
            switch (level) {
                case LogLevel.ERROR:
                    console.error(formatted);
                    break;
                case LogLevel.WARN:
                    console.warn(formatted);
                    break;
                case LogLevel.INFO:
                    console.info(formatted);
                    break;
                case LogLevel.DEBUG:
                    console.debug(formatted);
                    break;
            }
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        return levels.indexOf(level) <= levels.indexOf(this.logLevel);
    }

    error(message: string, meta?: any, requestId?: string): void {
        this.writeLog(LogLevel.ERROR, message, meta, requestId);
    }

    warn(message: string, meta?: any, requestId?: string): void {
        this.writeLog(LogLevel.WARN, message, meta, requestId);
    }

    info(message: string, meta?: any, requestId?: string): void {
        this.writeLog(LogLevel.INFO, message, meta, requestId);
    }

    debug(message: string, meta?: any, requestId?: string): void {
        this.writeLog(LogLevel.DEBUG, message, meta, requestId);
    }
}

export const logger = new Logger();

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    req.requestId = requestId;
    
    const startTime = Date.now();
    
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type')
    }, requestId);
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
        
        logger.writeLog(logLevel, `${req.method} ${req.path} ${res.statusCode}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        }, requestId);
    });
    
    next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const requestId = req.requestId;
    
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    }, requestId);
    
    next(err);
};

// Authentication event logging
export const logAuthEvent = (event: string, userId?: string, ip?: string, requestId?: string) => {
    logger.info(`Auth event: ${event}`, {
        userId,
        ip,
        event
    }, requestId);
};

// Thought action logging
export const logThoughtAction = (action: string, thoughtId?: string, userId?: string, requestId?: string) => {
    logger.info(`Thought action: ${action}`, {
        action,
        thoughtId,
        userId
    }, requestId);
};

// Security event logging
export const logSecurityEvent = (event: string, details: any, requestId?: string) => {
    logger.warn(`Security event: ${event}`, details, requestId);
};

// Rate limiting event logging
export const logRateLimitEvent = (ip: string, endpoint: string, requestId?: string) => {
    logger.warn('Rate limit exceeded', {
        ip,
        endpoint,
        action: 'RATE_LIMIT_EXCEEDED'
    }, requestId);
};

// Database operation logging
export const logDbOperation = (operation: string, collection: string, duration?: number, requestId?: string) => {
    logger.debug(`DB operation: ${operation}`, {
        operation,
        collection,
        duration: duration ? `${duration}ms` : undefined
    }, requestId);
};

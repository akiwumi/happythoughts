# Happy Thoughts - Authentication & CRUD Routes Implementation

This document outlines the complete implementation of Edit and Delete routes with JWT authentication for the Happy Thoughts application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Thought Model](#thought-model)
3. [JWT Authentication](#jwt-authentication)
4. [API Endpoints](#api-endpoints)
5. [Implementation Details](#implementation-details)
6. [Usage Examples](#usage-examples)
7. [Error Handling](#error-handling)

## 🎯 Overview

The authentication system provides:
- **JWT token generation and validation**
- **Protected routes with middleware**
- **Authorization checks (only authors can edit/delete)**
- **Complete CRUD operations for thoughts**

## 📊 Thought Model

### File: `backend/modals/Thought.ts`

```typescript
import { Schema, model } from "mongoose";
import type { ThoughtProps } from "../types.js";

const thoughtSchema = new Schema<ThoughtProps>({
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 140
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default model<ThoughtProps>("Thought", thoughtSchema);
```

### ThoughtProps Type (`backend/types.ts`)

```typescript
export interface ThoughtProps extends Document {
    _id: Types.ObjectId;
    message: string;
    author: Types.ObjectId;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}
```

## 🔐 JWT Authentication

### File: `backend/utils/verifyToken.ts`

```typescript
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
```

## 🛣️ API Endpoints

### File: `backend/routes/thought.routes.ts`

```typescript
import { Router } from "express";
import { 
    createThought, 
    getThoughts, 
    editThought, 
    deleteThought, 
    likeThought 
} from "../controllers/thought.controller.js";
import { authenticateToken } from "../utils/verifyToken.js";

const router = Router();

// Public routes
router.get("/", getThoughts);
router.post("/:id/like", likeThought);

// Protected routes (require authentication)
router.post("/", authenticateToken, createThought);
router.put("/:id", authenticateToken, editThought);
router.delete("/:id", authenticateToken, deleteThought);

export default router;
```

## 🎮 Implementation Details

### Thought Controller (`backend/controllers/thought.controller.ts`)

#### Create Thought - POST `/thoughts`
```typescript
export const createThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { message } = req.body;
        
        // Validation
        if (!message || message.trim().length < 5 || message.trim().length > 140) {
            res.status(400).json({ 
                message: "Message must be between 5 and 140 characters" 
            });
            return;
        }

        const thought = new Thought({
            message: message.trim(),
            author: req.user!.userId
        });

        await thought.save();
        await thought.populate('author', 'name email');

        res.status(201).json({ 
            success: true, 
            thought 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

#### Edit Thought - PUT `/thoughts/:id`
```typescript
export const editThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        // Validation
        if (!message || message.trim().length < 5 || message.trim().length > 140) {
            res.status(400).json({ 
                message: "Message must be between 5 and 140 characters" 
            });
            return;
        }

        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        // Authorization check - only author can edit
        if (thought.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized to edit this thought" });
            return;
        }

        // Update the thought
        thought.message = message.trim();
        thought.updatedAt = new Date();
        
        await thought.save();
        await thought.populate('author', 'name email');

        res.json({ 
            success: true, 
            thought 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

#### Delete Thought - DELETE `/thoughts/:id`
```typescript
export const deleteThought = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        // Authorization check - only author can delete
        if (thought.author.toString() !== req.user!.userId) {
            res.status(403).json({ message: "Not authorized to delete this thought" });
            return;
        }

        await Thought.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: "Thought deleted successfully" 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

#### Get All Thoughts - GET `/thoughts` (Public)
```typescript
export const getThoughts = async (req: Request, res: Response): Promise<void> => {
    try {
        const thoughts = await Thought.find()
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            thoughts 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

#### Like Thought - POST `/thoughts/:id/like` (Public)
```typescript
export const likeThought = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const thought = await Thought.findById(id);
        
        if (!thought) {
            res.status(404).json({ message: "Thought not found" });
            return;
        }

        thought.likes += 1;
        await thought.save();

        res.json({ 
            success: true, 
            likes: thought.likes 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

## 📝 Usage Examples

### 1. User Registration & Login

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 2. Create a Thought (Authenticated)

```bash
curl -X POST http://localhost:3000/thoughts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"I am having a wonderful day!"}'
```

### 3. Edit a Thought (Authenticated + Author Only)

```bash
curl -X PUT http://localhost:3000/thoughts/THOUGHT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message":"I am having an amazing day!"}'
```

### 4. Delete a Thought (Authenticated + Author Only)

```bash
curl -X DELETE http://localhost:3000/thoughts/THOUGHT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get All Thoughts (Public)

```bash
curl -X GET http://localhost:3000/thoughts
```

### 6. Like a Thought (Public)

```bash
curl -X POST http://localhost:3000/thoughts/THOUGHT_ID/like
```

## ⚠️ Error Handling

### HTTP Status Codes

- **200** - Success
- **201** - Created (for new thoughts)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (no token provided)
- **403** - Forbidden (invalid token, not authorized)
- **404** - Not Found (thought doesn't exist)
- **500** - Internal Server Error

### Common Error Responses

```json
{
  "message": "Access token required"
}
```

```json
{
  "message": "Invalid or expired token"
}
```

```json
{
  "message": "Not authorized to edit this thought"
}
```

```json
{
  "message": "Message must be between 5 and 140 characters"
}
```

## 🔄 Backend Integration

### File: `backend/index.ts`

```typescript
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import thoughtRoutes from "./routes/thought.routes.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/thoughts", thoughtRoutes);

app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

connectDB()
    .then(() => {
        console.log("MongoDB connected");
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server due to database connection error", error);
    });
```

## 🎯 Key Features

### ✅ Authentication
- JWT token generation and validation
- Token expiration handling
- User existence verification

### ✅ Authorization
- Only thought authors can edit/delete
- Middleware-based route protection
- Role-based access control

### ✅ Validation
- Message length validation (5-140 characters)
- Required field validation
- Data sanitization (trim whitespace)

### ✅ Security
- Password hashing with bcrypt
- JWT secret protection
- CORS configuration

### ✅ Error Handling
- Comprehensive error responses
- Proper HTTP status codes
- Graceful failure handling

## 🚀 Next Steps

1. **Frontend Integration**: Update frontend to use new API endpoints
2. **Token Storage**: Implement secure token storage in frontend
3. **Refresh Tokens**: Add token refresh mechanism
4. **Rate Limiting**: Implement API rate limiting
5. **Input Sanitization**: Add XSS protection
6. **Logging**: Add comprehensive logging system

---

**Created**: April 27, 2026  
**Author**: Cascade AI Assistant  
**Version**: 1.0.0

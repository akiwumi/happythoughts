import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import thoughtRoutes from "./routes/thought.routes.js";
import createMessageRouter from "./routes/message.routes.js";
import { xssProtection, securityHeaders } from "./middleware/security.js";
import { requestLogger, errorLogger } from "./utils/logger.js";
import { seedDefaultUser } from "./seed.js";
import { verifyToken } from "./utils/verifyToken.js";

dotenv.config();

const app = express();

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(securityHeaders);
app.use(xssProtection);
app.use(requestLogger);
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));

const server = http.createServer(app);

const io = new Server(server, {
    path: process.env.SOCKET_IO_PATH || "/_/backend/socket.io",
    cors: { origin: allowedOrigins, credentials: true },
});

// Authenticate socket connections
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
        const user = await verifyToken(token);
        socket.data.user = user;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id, socket.data.user?.email);
    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

app.use("/auth", authRoutes);
app.use("/thoughts", thoughtRoutes);
app.use("/messages", createMessageRouter(io));

app.use(errorLogger);

app.get("/", (_req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3001;

connectDB()
    .then(() => {
        console.log("MongoDB connected");
        seedDefaultUser();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to start server due to database connection error", error);
    });

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import thoughtRoutes from "./routes/thought.routes.js";
import { xssProtection, securityHeaders } from "./middleware/security.js";
import { requestLogger, errorLogger } from "./utils/logger.js";

dotenv.config();

const app = express();

const allowedOrigins = ["*"];

app.use(securityHeaders);
app.use(xssProtection);
app.use(requestLogger);
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Mount routes under /_/backend prefix (Vercel rewrites strip this prefix)
app.use("/auth", authRoutes);
app.use("/thoughts", thoughtRoutes);

app.use(errorLogger);

app.get("/", (_req, res) => {
    res.send("Server is running");
});

// Connect DB once (Vercel keeps the function warm between invocations)
connectDB().catch(console.error);

export default app;

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { Server } from "http";

import { connectDatabase } from "./config/database";
import logger from "./config/logger";
import scheduleRoutes from "./routes/scheduleRoutes";

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to database
connectDatabase();

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Schedule Service is healthy",
    timestamp: new Date().toISOString(),
    service: "schedule-service",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/schedules", scheduleRoutes);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error("Unhandled error:", error);

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
    return;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

const server: Server = app.listen(PORT, () => {
  logger.info(`Schedule Service is running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

export default app;

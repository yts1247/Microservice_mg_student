require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { connectDatabase } = require("./config/database");
const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 3004;

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
  windowMs: 15 * 60 * 1000,
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
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enrollment Service is healthy",
    timestamp: new Date().toISOString(),
    service: "enrollment-service",
    version: "1.0.0",
  });
});

// Basic enrollment routes placeholder
app.get("/api/enrollments", (req, res) => {
  res.json({
    success: true,
    message: "Enrollment Service is running",
    data: [],
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Enrollment Service is running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;

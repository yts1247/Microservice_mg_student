require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { connectDatabase } = require("./config/database");
const logger = require("./config/logger");
const courseRoutes = require("./routes/courseRoutes");

const app = express();
const PORT = process.env.PORT || 3002;

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
    message: "Course Service is healthy",
    timestamp: new Date().toISOString(),
    service: "course-service",
    version: "1.0.0",
  });
});

// Routes
app.use("/api/courses", courseRoutes);

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

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Course Service is running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;

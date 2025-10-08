require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const logger = require("./config/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Student Management System API Gateway",
      version: "1.0.0",
      description: "API Gateway for Student Management Microservices",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);

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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
    timestamp: new Date().toISOString(),
    service: "api-gateway",
    version: "1.0.0",
    services: {
      userService: process.env.USER_SERVICE_URL,
      courseService: process.env.COURSE_SERVICE_URL,
      scheduleService: process.env.SCHEDULE_SERVICE_URL,
      enrollmentService: process.env.ENROLLMENT_SERVICE_URL,
    },
  });
});

// Service status check
app.get("/status", async (req, res) => {
  const services = [
    { name: "User Service", url: process.env.USER_SERVICE_URL },
    { name: "Course Service", url: process.env.COURSE_SERVICE_URL },
    { name: "Schedule Service", url: process.env.SCHEDULE_SERVICE_URL },
    { name: "Enrollment Service", url: process.env.ENROLLMENT_SERVICE_URL },
  ];

  const serviceStatus = await Promise.all(
    services.map(async (service) => {
      try {
        const axios = require("axios");
        const response = await axios.get(`${service.url}/health`, {
          timeout: 5000,
        });
        return {
          name: service.name,
          status: "healthy",
          url: service.url,
          response: response.status,
        };
      } catch (error) {
        return {
          name: service.name,
          status: "unhealthy",
          url: service.url,
          error: error.message,
        };
      }
    })
  );

  res.status(200).json({
    success: true,
    message: "Service status check completed",
    services: serviceStatus,
  });
});

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  onError: (err, req, res) => {
    logger.error(`Proxy error for ${req.url}:`, err);
    res.status(500).json({
      success: false,
      message: "Service temporarily unavailable",
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(
      `Proxying ${req.method} ${req.url} to ${proxyReq.getHeader("host")}`
    );
  },
};

// User Service Proxy
app.use(
  "/api/users",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    pathRewrite: {
      "^/api/users": "/api/users",
    },
    ...proxyOptions,
  })
);

// Course Service Proxy
app.use(
  "/api/courses",
  createProxyMiddleware({
    target: process.env.COURSE_SERVICE_URL || "http://localhost:3002",
    pathRewrite: {
      "^/api/courses": "/api/courses",
    },
    ...proxyOptions,
  })
);

// Schedule Service Proxy
app.use(
  "/api/schedules",
  createProxyMiddleware({
    target: process.env.SCHEDULE_SERVICE_URL || "http://localhost:3003",
    pathRewrite: {
      "^/api/schedules": "/api/schedules",
    },
    ...proxyOptions,
  })
);

// Enrollment Service Proxy
app.use(
  "/api/enrollments",
  createProxyMiddleware({
    target: process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3004",
    pathRewrite: {
      "^/api/enrollments": "/api/enrollments",
    },
    ...proxyOptions,
  })
);

// API Overview endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Student Management System API Gateway",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      users: "/api/users",
      courses: "/api/courses",
      schedules: "/api/schedules",
      enrollments: "/api/enrollments",
    },
    services: {
      userService: process.env.USER_SERVICE_URL,
      courseService: process.env.COURSE_SERVICE_URL,
      scheduleService: process.env.SCHEDULE_SERVICE_URL,
      enrollmentService: process.env.ENROLLMENT_SERVICE_URL,
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    availableEndpoints: [
      "/api/users",
      "/api/courses",
      "/api/schedules",
      "/api/enrollments",
      "/api-docs",
    ],
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

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

const server = app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(
    `Service status check available at http://localhost:${PORT}/status`
  );
});

module.exports = app;

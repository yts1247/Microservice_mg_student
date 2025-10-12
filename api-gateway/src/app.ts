import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Server } from "http";

import logger from "./config/logger";
import {
  logRequest,
  authenticateToken,
  requirePermission,
} from "./middleware/rbac";
import { PermissionAction, PermissionResource } from "./types/rbac.types";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression() as any);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for gateway
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use(logRequest);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Student Management System API",
      version: "1.0.0",
      description: "API Gateway for Student Management Microservices",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/docs/*.yaml"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api/docs", swaggerUi.serve as any, swaggerUi.setup(specs) as any);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API Gateway is healthy",
    timestamp: new Date().toISOString(),
    service: "api-gateway",
    version: "1.0.0",
    services: {
      userService: process.env.USER_SERVICE_URL || "http://localhost:3001",
      courseService: process.env.COURSE_SERVICE_URL || "http://localhost:3002",
      scheduleService:
        process.env.SCHEDULE_SERVICE_URL || "http://localhost:3003",
      enrollmentService:
        process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3004",
    },
  });
});

// Service proxies
const serviceProxies = {
  users: createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/users": "/api/users",
    },
    onError: (err, req, res) => {
      logger.error("User Service Proxy Error:", err);
      if (res instanceof express.response.constructor) {
        res.status(503).json({
          success: false,
          message: "User service is currently unavailable",
        });
      }
    },
  }),

  courses: createProxyMiddleware({
    target: process.env.COURSE_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
      "^/api/courses": "/api/courses",
    },
    onError: (err, req, res) => {
      logger.error("Course Service Proxy Error:", err);
      if (res instanceof express.response.constructor) {
        res.status(503).json({
          success: false,
          message: "Course service is currently unavailable",
        });
      }
    },
  }),

  schedules: createProxyMiddleware({
    target: process.env.SCHEDULE_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
      "^/api/schedules": "/api/schedules",
    },
    onError: (err, req, res) => {
      logger.error("Schedule Service Proxy Error:", err);
      if (res instanceof express.response.constructor) {
        res.status(503).json({
          success: false,
          message: "Schedule service is currently unavailable",
        });
      }
    },
  }),

  enrollments: createProxyMiddleware({
    target: process.env.ENROLLMENT_SERVICE_URL || "http://localhost:3004",
    changeOrigin: true,
    pathRewrite: {
      "^/api/enrollments": "/api/enrollments",
    },
    onError: (err, req, res) => {
      logger.error("Enrollment Service Proxy Error:", err);
      if (res instanceof express.response.constructor) {
        res.status(503).json({
          success: false,
          message: "Enrollment service is currently unavailable",
        });
      }
    },
  }),
};

// Apply service routes
app.use("/api/users", serviceProxies.users);
app.use("/api/courses", serviceProxies.courses);
app.use("/api/schedules", serviceProxies.schedules);
app.use("/api/enrollments", serviceProxies.enrollments);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    availableRoutes: [
      "/api/users",
      "/api/courses",
      "/api/schedules",
      "/api/enrollments",
      "/api/docs",
      "/health",
    ],
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error("Gateway error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

const server: Server = app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);
  logger.info(
    `API Documentation available at http://localhost:${PORT}/api/docs`
  );
});

export default app;

import axios from "axios";
import { Response, NextFunction } from "express";
import logger from "../config/logger";
import { AuthenticatedRequest } from "../types/common.types";

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return;
    }

    // Verify token with User Service
    const userServiceUrl =
      process.env.USER_SERVICE_URL || "http://localhost:3001";
    const response = await axios.get(`${userServiceUrl}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) {
      req.user = response.data.data.user;
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }
  } catch (error: any) {
    logger.error("Authentication error:", error.message);

    if (error.response && error.response.status === 401) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Authentication service unavailable",
    });
    return;
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
};

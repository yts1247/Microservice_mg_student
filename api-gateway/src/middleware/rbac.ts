import { Request, Response, NextFunction } from "express";
import { getGRPCUserClient } from "../services/grpcUserClient";
import logger from "../config/logger";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        roles: any[];
        permissions: string[];
      };
    }
  }
}

/**
 * Authentication middleware for API Gateway
 * Uses gRPC to validate tokens with User service
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token via gRPC
    const grpcClient = getGRPCUserClient();
    const validation = await grpcClient.validateToken(token);

    if (!validation.valid || !validation.user) {
      res.status(401).json({
        success: false,
        message: validation.message || "Invalid token",
      });
      return;
    }

    // Get user permissions
    const permissionsResult = await grpcClient.getUserPermissions(
      validation.user.id
    );

    // Set user data in request
    req.user = {
      id: validation.user.id,
      email: validation.user.email,
      name:
        validation.user.profile?.first_name +
        " " +
        validation.user.profile?.last_name,
      roles: validation.user.roles || [],
      permissions: permissionsResult.permissions || [],
    };

    logger.info(`User authenticated: ${req.user.email}`, {
      userId: req.user.id,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Authorization middleware - check if user has required permission
 */
export const requirePermission = (resource: string, action: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    try {
      const grpcClient = getGRPCUserClient();
      const permissionCheck = await grpcClient.checkPermission(
        req.user.id,
        resource,
        action
      );

      if (!permissionCheck.allowed) {
        logger.warn(`Permission denied for user ${req.user.email}`, {
          userId: req.user.id,
          resource,
          action,
          endpoint: req.path,
          method: req.method,
        });

        res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${resource}.${action}`,
        });
        return;
      }

      logger.info(`Permission granted for user ${req.user.email}`, {
        userId: req.user.id,
        resource,
        action,
        endpoint: req.path,
      });

      next();
    } catch (error) {
      logger.error("Authorization error:", error);
      res.status(500).json({
        success: false,
        message: "Authorization check failed",
      });
    }
  };
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userRoles = req.user.roles.map((role) => role.name?.toLowerCase());
    const hasRequiredRole = roles.some((role) =>
      userRoles.includes(role.toLowerCase())
    );

    if (!hasRequiredRole) {
      logger.warn(`Role access denied for user ${req.user.email}`, {
        userId: req.user.id,
        userRoles,
        requiredRoles: roles,
        endpoint: req.path,
      });

      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole("admin", "super admin");

/**
 * Super admin only middleware
 */
export const requireSuperAdmin = requireRole("super admin");

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const grpcClient = getGRPCUserClient();
    const validation = await grpcClient.validateToken(token);

    if (validation.valid && validation.user) {
      const permissionsResult = await grpcClient.getUserPermissions(
        validation.user.id
      );

      req.user = {
        id: validation.user.id,
        email: validation.user.email,
        name:
          validation.user.profile?.first_name +
          " " +
          validation.user.profile?.last_name,
        roles: validation.user.roles || [],
        permissions: permissionsResult.permissions || [],
      };
    }
  } catch (error) {
    logger.warn("Optional auth failed:", error);
  }

  next();
};

/**
 * Resource ownership check
 */
export const requireOwnership = (resourceIdParam: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Super admin and admin can access everything
    const userRoles = req.user.roles.map((role) => role.name?.toLowerCase());
    if (userRoles.includes("super admin") || userRoles.includes("admin")) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceId = req.params[resourceIdParam];
    if (resourceId === req.user.id) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own resources",
    });
  };
};

/**
 * Request logging middleware with user context
 */
export const logRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log response when finished
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;

    logger.info("API Gateway Request", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
};

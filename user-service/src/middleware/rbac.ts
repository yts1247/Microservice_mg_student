import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { RoleModel } from "../models/Role";
import { PermissionModel } from "../models/Permission";
import {
  AuthContext,
  PermissionAction,
  PermissionResource,
  Role,
  Permission,
} from "../types/rbac.types";
import { IRole } from "../models/Role";
import { IPermission } from "../models/Permission";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Middleware to authenticate user and populate auth context
 */
export const authenticateUser = async (
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

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Fetch user with roles and permissions
    const user = await User.findById(decoded.id).populate({
      path: "roles",
      populate: {
        path: "permissions",
        model: "Permission",
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: "Invalid token or user not active",
      });
      return;
    }

    // Convert IRole to Role for type compatibility
    const convertedRoles: Role[] = (user.roles || []).map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      permissions: (role.permissions || []).map((permission) => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        created_at: permission.created_at?.toISOString(),
        updated_at: permission.updated_at?.toISOString(),
      })),
      created_at: role.created_at?.toISOString(),
      updated_at: role.updated_at?.toISOString(),
    }));

    // Build auth context
    const authContext: AuthContext = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        roles: convertedRoles,
      },

      // Check if user has specific permission
      hasPermission: (
        resource: string,
        action: string,
        resourceId?: string
      ): boolean => {
        // Super admin has all permissions
        if (authContext.isSuperAdmin()) {
          return true;
        }

        // Check role-based permissions
        return (
          user.roles?.some((role) =>
            role.permissions?.some(
              (permission) =>
                permission.resource === resource &&
                (permission.action === action || permission.action === "manage")
            )
          ) || false
        );
      },

      // Check if user has specific role
      hasRole: (roleName: string): boolean => {
        return (
          user.roles?.some(
            (role) => role.name.toLowerCase() === roleName.toLowerCase()
          ) || false
        );
      },

      // Check if user is super admin
      isSuperAdmin: (): boolean => {
        return (
          user.roles?.some(
            (role) => role.name.toLowerCase() === "super admin"
          ) || false
        );
      },
    };

    req.auth = authContext;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (
  resource: PermissionResource | string,
  action: PermissionAction | string
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!req.auth.hasPermission(resource, action)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${resource}.${action}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const hasRequiredRole = roles.some((role) => req.auth!.hasRole(role));

    if (!hasRequiredRole) {
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
 * Middleware to check if user is super admin
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  if (!req.auth.isSuperAdmin()) {
    res.status(403).json({
      success: false,
      message: "Access denied. Super admin required",
    });
    return;
  }

  next();
};

/**
 * Middleware to check resource ownership or admin access
 */
export const requireOwnershipOrAdmin = (resourceField: string = "user_id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Super admin or admin can access everything
    if (req.auth.isSuperAdmin() || req.auth.hasRole("admin")) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    if (resourceUserId === req.auth.user.id) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Access denied. Resource ownership or admin access required",
    });
  };
};

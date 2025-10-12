/**
 * RBAC Types for API Gateway
 * Định nghĩa các types cho hệ thống phân quyền trong API Gateway
 */

// Enum cho các hành động có thể thực hiện
export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  APPROVE = "approve",
  REJECT = "reject",
  ASSIGN = "assign",
  UNASSIGN = "unassign",
  VIEW_ALL = "view_all",
  EXPORT = "export",
  IMPORT = "import",
}

// Enum cho các tài nguyên trong hệ thống
export enum PermissionResource {
  USER = "user",
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
  COURSE = "course",
  SCHEDULE = "schedule",
  ENROLLMENT = "enrollment",
  GRADE = "grade",
  ATTENDANCE = "attendance",
  REPORT = "report",
  SYSTEM = "system",
  SETTING = "setting",
}

// Interface cho permission
export interface IPermission {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
  conditions?: Record<string, any>;
}

// Interface cho role
export interface IRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface cho user context
export interface IUserContext {
  id: string;
  email: string;
  name: string;
  roles: any[];
  permissions: string[];
  isActive?: boolean;
  lastLogin?: Date;
}

// System roles configuration
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  MODERATOR: "moderator",
  VIEWER: "viewer",
} as const;

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// RBAC Configuration
export interface RBACConfig {
  enforcePermissions: boolean;
  allowSuperAdminBypass: boolean;
  cachePermissions: boolean;
  cacheTTL: number;
}

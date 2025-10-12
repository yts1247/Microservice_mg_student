// Role-based Access Control Types

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
}

// Permission Actions
export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  EXECUTE = "execute",
}

// Permission Resources
export enum PermissionResource {
  USERS = "users",
  COURSES = "courses",
  ENROLLMENTS = "enrollments",
  SCHEDULES = "schedules",
  LOGS = "logs",
  ROLES = "roles",
  PERMISSIONS = "permissions",
  DASHBOARD = "dashboard",
  SYSTEM = "system",
}

// Pre-defined Roles with Permissions
export const SYSTEM_ROLES = {
  SUPER_ADMIN: {
    name: "Super Admin",
    description: "Full system access",
    permissions: [
      // All permissions for all resources
      "users.*",
      "courses.*",
      "enrollments.*",
      "schedules.*",
      "logs.*",
      "roles.*",
      "permissions.*",
      "dashboard.*",
      "system.*",
    ],
  },
  ADMIN: {
    name: "Admin",
    description: "Administrative access",
    permissions: [
      "users.read",
      "users.update",
      "users.create",
      "courses.*",
      "enrollments.*",
      "schedules.*",
      "logs.read",
      "dashboard.read",
    ],
  },
  INSTRUCTOR: {
    name: "Instructor",
    description: "Instructor access",
    permissions: [
      "courses.read",
      "courses.update",
      "courses.create",
      "schedules.read",
      "schedules.update",
      "schedules.create",
      "enrollments.read",
      "dashboard.read",
    ],
  },
  STUDENT: {
    name: "Student",
    description: "Student access",
    permissions: [
      "courses.read",
      "enrollments.read",
      "enrollments.create",
      "enrollments.update",
      "schedules.read",
    ],
  },
} as const;

// Permission check helper
export interface PermissionContext {
  userId: string;
  roles: Role[];
  resource: string;
  action: string;
  resourceId?: string;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    roles: Role[];
  };
  hasPermission: (
    resource: string,
    action: string,
    resourceId?: string
  ) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: () => boolean;
}

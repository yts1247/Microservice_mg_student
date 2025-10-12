/**
 * Role-based Access Control Types for Frontend
 */

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

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string; // Legacy role field
  roles: Role[]; // New RBAC roles
  isActive: boolean;
  avatar?: string;
  lastLogin?: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  permissions?: string[]; // Computed permissions
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Permission Resources (should match backend)
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

// Permission Actions (should match backend)
export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  EXECUTE = "execute",
}

// UI Component Props for RBAC
export interface RBACProps {
  resource: PermissionResource | string;
  action: PermissionAction | string;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Menu Item with RBAC
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permissions?: {
    resource: string;
    action: string;
  };
  roles?: string[];
  visible?: boolean;
}

// Navigation structure
export interface NavigationConfig {
  items: MenuItem[];
}

// Role-based menu visibility
export interface MenuVisibility {
  [key: string]: boolean;
}

// RBAC Context
export interface RBACContextType {
  user: User | null;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
  isSuperAdmin: () => boolean;
  getVisibleMenuItems: (items: MenuItem[]) => MenuItem[];
  loading: boolean;
}

// API Response types
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken?: string;
  };
}

export interface RoleManagementResponse {
  success: boolean;
  message: string;
  data?: {
    roles: Role[];
    permissions: Permission[];
  };
}

export interface UserPermissionsResponse {
  success: boolean;
  permissions: string[];
  roles: Role[];
}

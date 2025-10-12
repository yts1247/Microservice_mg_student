"use client";

import React from "react";
import { useRBAC } from "../contexts/RBACContext";
import {
  RBACProps,
  PermissionResource,
  PermissionAction,
} from "../types/rbac.types";

/**
 * RBAC Guard Component
 * Conditionally renders children based on user permissions and roles
 */
export const RBACGuard: React.FC<RBACProps> = ({
  resource,
  action,
  roles,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyRole, loading } = useRBAC();

  // Show loading state if RBAC is still initializing
  if (loading) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    if (!hasAnyRole(roles)) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (resource && action) {
    if (!hasPermission(resource, action)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

/**
 * Higher-Order Component for RBAC
 */
export function withRBAC<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions?: { resource: string; action: string }[],
  requiredRoles?: string[]
) {
  const WithRBACComponent = (props: P) => {
    const { hasPermission, hasAnyRole, loading } = useRBAC();

    if (loading) {
      return <div>Loading...</div>;
    }

    // Check roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasAnyRole(requiredRoles)) {
        return <div>Access Denied</div>;
      }
    }

    // Check permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((perm) =>
        hasPermission(perm.resource, perm.action)
      );

      if (!hasAllPermissions) {
        return <div>Insufficient Permissions</div>;
      }
    }

    return <WrappedComponent {...props} />;
  };

  WithRBACComponent.displayName = `withRBAC(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return WithRBACComponent;
}

/**
 * Permission Check Hook
 */
export const usePermission = () => {
  const { hasPermission, hasRole, hasAnyRole, isSuperAdmin } = useRBAC();

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,

    // Convenience methods for common permissions
    canViewUsers: () =>
      hasPermission(PermissionResource.USERS, PermissionAction.READ),
    canCreateUsers: () =>
      hasPermission(PermissionResource.USERS, PermissionAction.CREATE),
    canEditUsers: () =>
      hasPermission(PermissionResource.USERS, PermissionAction.UPDATE),
    canDeleteUsers: () =>
      hasPermission(PermissionResource.USERS, PermissionAction.DELETE),
    canManageUsers: () =>
      hasPermission(PermissionResource.USERS, PermissionAction.MANAGE),

    canViewCourses: () =>
      hasPermission(PermissionResource.COURSES, PermissionAction.READ),
    canCreateCourses: () =>
      hasPermission(PermissionResource.COURSES, PermissionAction.CREATE),
    canEditCourses: () =>
      hasPermission(PermissionResource.COURSES, PermissionAction.UPDATE),
    canDeleteCourses: () =>
      hasPermission(PermissionResource.COURSES, PermissionAction.DELETE),
    canManageCourses: () =>
      hasPermission(PermissionResource.COURSES, PermissionAction.MANAGE),

    canViewEnrollments: () =>
      hasPermission(PermissionResource.ENROLLMENTS, PermissionAction.READ),
    canCreateEnrollments: () =>
      hasPermission(PermissionResource.ENROLLMENTS, PermissionAction.CREATE),
    canEditEnrollments: () =>
      hasPermission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE),
    canDeleteEnrollments: () =>
      hasPermission(PermissionResource.ENROLLMENTS, PermissionAction.DELETE),
    canManageEnrollments: () =>
      hasPermission(PermissionResource.ENROLLMENTS, PermissionAction.MANAGE),

    canViewSchedules: () =>
      hasPermission(PermissionResource.SCHEDULES, PermissionAction.READ),
    canCreateSchedules: () =>
      hasPermission(PermissionResource.SCHEDULES, PermissionAction.CREATE),
    canEditSchedules: () =>
      hasPermission(PermissionResource.SCHEDULES, PermissionAction.UPDATE),
    canDeleteSchedules: () =>
      hasPermission(PermissionResource.SCHEDULES, PermissionAction.DELETE),
    canManageSchedules: () =>
      hasPermission(PermissionResource.SCHEDULES, PermissionAction.MANAGE),

    canViewLogs: () =>
      hasPermission(PermissionResource.LOGS, PermissionAction.READ),
    canManageLogs: () =>
      hasPermission(PermissionResource.LOGS, PermissionAction.MANAGE),

    canViewRoles: () =>
      hasPermission(PermissionResource.ROLES, PermissionAction.READ),
    canManageRoles: () =>
      hasPermission(PermissionResource.ROLES, PermissionAction.MANAGE),

    canViewDashboard: () =>
      hasPermission(PermissionResource.DASHBOARD, PermissionAction.READ),
    canManageSystem: () =>
      hasPermission(PermissionResource.SYSTEM, PermissionAction.MANAGE),
  };
};

/**
 * Role Check Hook
 */
export const useRole = () => {
  const { hasRole, hasAnyRole, isSuperAdmin } = useRBAC();

  return {
    hasRole,
    hasAnyRole,
    isSuperAdmin,

    // Convenience methods for common roles
    isStudent: () => hasRole("student"),
    isInstructor: () => hasRole("instructor"),
    isAdmin: () => hasRole("admin"),

    // Role combinations
    isStaff: () => hasAnyRole(["instructor", "admin", "super admin"]),
    isAdminLevel: () => hasAnyRole(["admin", "super admin"]),
  };
};

export default RBACGuard;

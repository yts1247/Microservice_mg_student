"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, RBACContextType, MenuItem } from "../types/rbac.types";
import { authService } from "../services/authService";

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      localStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    // Super admin has all permissions
    if (isSuperAdmin()) return true;

    // Check if user has the permission through any role
    return (
      user.roles?.some((role) =>
        role.permissions?.some(
          (permission) =>
            permission.resource === resource &&
            (permission.action === action || permission.action === "manage")
        )
      ) || false
    );
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;

    return (
      user.roles?.some(
        (role) => role.name.toLowerCase() === roleName.toLowerCase()
      ) || false
    );
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user) return false;

    return roleNames.some((roleName) => hasRole(roleName));
  };

  /**
   * Check if user is super admin
   */
  const isSuperAdmin = (): boolean => {
    if (!user) return false;

    return (
      user.roles?.some(
        (role) =>
          role.name.toLowerCase() === "super admin" ||
          role.name.toLowerCase() === "superadmin"
      ) || false
    );
  };

  /**
   * Filter menu items based on user permissions
   */
  const getVisibleMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!user) return [];

    return items.filter((item) => {
      // Check if item has permission requirements
      if (item.permissions) {
        const hasRequiredPermission = hasPermission(
          item.permissions.resource,
          item.permissions.action
        );
        if (!hasRequiredPermission) return false;
      }

      // Check if item has role requirements
      if (item.roles && item.roles.length > 0) {
        const hasRequiredRole = hasAnyRole(item.roles);
        if (!hasRequiredRole) return false;
      }

      // Filter children if they exist
      if (item.children) {
        item.children = getVisibleMenuItems(item.children);
        // Hide parent if no children are visible
        if (item.children.length === 0) return false;
      }

      return true;
    });
  };

  const contextValue: RBACContextType = {
    user,
    hasPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    getVisibleMenuItems,
    loading,
  };

  return (
    <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
};

export default RBACProvider;

import { RoleModel, IRole } from "../models/Role";
import { PermissionModel, IPermission } from "../models/Permission";
import User from "../models/User";
import {
  SYSTEM_ROLES,
  PermissionAction,
  PermissionResource,
} from "../types/rbac.types";

/**
 * Role and Permission Management Service
 * Handles RBAC operations
 */
export class RBACService {
  /**
   * Initialize system with default permissions and roles
   */
  static async initializeSystem(): Promise<void> {
    try {
      // Create all possible permissions
      await this.createSystemPermissions();

      // Create system roles
      await this.createSystemRoles();

      console.log("RBAC system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize RBAC system:", error);
      throw error;
    }
  }

  /**
   * Create all system permissions based on resources and actions
   */
  private static async createSystemPermissions(): Promise<void> {
    const resources = Object.values(PermissionResource);
    const actions = Object.values(PermissionAction);

    const permissions = [];

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push({
          id: `${resource}.${action}`,
          name: `${
            action.charAt(0).toUpperCase() + action.slice(1)
          } ${resource}`,
          description: `Allow ${action} operations on ${resource}`,
          resource,
          action,
        });
      }
    }

    // Use upsert to avoid duplicates
    for (const permission of permissions) {
      await PermissionModel.findOneAndUpdate(
        { id: permission.id },
        permission,
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Create system roles with predefined permissions
   */
  private static async createSystemRoles(): Promise<void> {
    for (const [roleKey, roleData] of Object.entries(SYSTEM_ROLES)) {
      // Find permissions for this role
      const permissionIds = [];

      for (const permissionPattern of roleData.permissions) {
        if (permissionPattern.includes("*")) {
          // Handle wildcard permissions (e.g., 'users.*')
          const resource = permissionPattern.split(".")[0];
          const permissions = await PermissionModel.find({ resource });
          permissionIds.push(...permissions.map((p) => p._id));
        } else {
          // Handle specific permissions
          const permission = await PermissionModel.findOne({
            id: permissionPattern,
          });
          if (permission) {
            permissionIds.push(permission._id);
          }
        }
      }

      // Create or update role
      await RoleModel.findOneAndUpdate(
        { id: roleKey.toLowerCase() },
        {
          id: roleKey.toLowerCase(),
          name: roleData.name,
          description: roleData.description,
          permissions: permissionIds,
          is_active: true,
        },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(
    userId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      const role = await RoleModel.findOne({ id: roleId });

      if (!user || !role) {
        return false;
      }

      // Add role if not already assigned
      if (!user.roles?.some((r) => r.toString() === role._id.toString())) {
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { roles: role._id } },
          { new: true }
        );
      }

      return true;
    } catch (error) {
      console.error("Error assigning role to user:", error);
      return false;
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(
    userId: string,
    roleId: string
  ): Promise<boolean> {
    try {
      const role = await RoleModel.findOne({ id: roleId });
      if (!role) return false;

      await User.findByIdAndUpdate(
        userId,
        { $pull: { roles: role._id } },
        { new: true }
      );

      return true;
    } catch (error) {
      console.error("Error removing role from user:", error);
      return false;
    }
  }

  /**
   * Get all roles with permissions
   */
  static async getAllRoles(): Promise<IRole[]> {
    return await RoleModel.find({ is_active: true }).populate("permissions");
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<IPermission[]> {
    return await PermissionModel.find().sort({ resource: 1, action: 1 });
  }

  /**
   * Create custom role
   */
  static async createRole(
    name: string,
    description: string,
    permissionIds: string[]
  ): Promise<IRole | null> {
    try {
      const permissions = await PermissionModel.find({
        id: { $in: permissionIds },
      });

      const role = new RoleModel({
        name,
        description,
        permissions: permissions.map((p) => p._id),
        is_active: true,
      });

      return await role.save();
    } catch (error) {
      console.error("Error creating role:", error);
      return null;
    }
  }

  /**
   * Update role permissions
   */
  static async updateRolePermissions(
    roleId: string,
    permissionIds: string[]
  ): Promise<IRole | null> {
    try {
      const permissions = await PermissionModel.find({
        id: { $in: permissionIds },
      });

      return await RoleModel.findOneAndUpdate(
        { id: roleId },
        { permissions: permissions.map((p) => p._id) },
        { new: true }
      ).populate("permissions");
    } catch (error) {
      console.error("Error updating role permissions:", error);
      return null;
    }
  }

  /**
   * Check if user has permission
   */
  static async userHasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId).populate({
        path: "roles",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      if (!user) return false;

      // Check if user has the required permission through any role
      return (
        user.roles?.some((role) =>
          role.permissions?.some(
            (permission) =>
              permission.resource === resource &&
              (permission.action === action || permission.action === "manage")
          )
        ) || false
      );
    } catch (error) {
      console.error("Error checking user permission:", error);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await User.findById(userId).populate({
        path: "roles",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      if (!user) return [];

      const permissions = new Set<string>();

      user.roles?.forEach((role) => {
        role.permissions?.forEach((permission) => {
          permissions.add(`${permission.resource}.${permission.action}`);
        });
      });

      return Array.from(permissions);
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }
}

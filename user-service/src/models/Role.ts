import mongoose, { Schema, Document } from "mongoose";
import { Role } from "../types/rbac.types";
import { IPermission } from "./Permission";

/**
 * Role Model
 * Represents a role with associated permissions
 */
export interface IRole extends Document {
  id: string;
  name: string;
  description: string;
  permissions: IPermission[];
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Create role ID from name
RoleSchema.pre("save", function (next) {
  if (!this.id && this.name) {
    this.id = this.name.toLowerCase().replace(/\s+/g, "_");
  }
  next();
});

// Instance methods
RoleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Static methods
RoleSchema.statics.findByName = function (name: string) {
  return this.findOne({ name }).populate("permissions");
};

RoleSchema.statics.findActiveRoles = function () {
  return this.find({ is_active: true }).populate("permissions");
};

// Check if role has specific permission
RoleSchema.methods.hasPermission = function (
  resource: string,
  action: string
): boolean {
  return this.permissions.some(
    (permission: IPermission) =>
      permission.resource === resource &&
      (permission.action === action || permission.action === "manage")
  );
};

export const RoleModel = mongoose.model<IRole>("Role", RoleSchema);

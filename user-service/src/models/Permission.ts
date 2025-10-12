import mongoose, { Schema, Document } from "mongoose";
import {
  Permission,
  PermissionAction,
  PermissionResource,
} from "../types/rbac.types";

/**
 * Permission Model
 * Represents a single permission in the system
 */
export interface IPermission extends Document {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at?: Date;
  updated_at?: Date;
}

const PermissionSchema = new Schema<IPermission>(
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
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      enum: Object.values(PermissionResource),
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(PermissionAction),
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

// Compound index for resource + action
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

// Create permission ID from resource and action
PermissionSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = `${this.resource}.${this.action}`;
  }
  next();
});

// Instance methods
PermissionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const PermissionModel = mongoose.model<IPermission>(
  "Permission",
  PermissionSchema
);

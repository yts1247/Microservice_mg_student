import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, IUserMethods, IUserDocument } from "../types/user.types";
import { IRole } from "./Role";

interface IUserModel extends Model<IUserDocument> {
  findByEmailOrUsername(identifier: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [50, "Username cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in query results by default
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    profile: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
      },
      dateOfBirth: {
        type: Date,
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      avatar: {
        type: String,
        default: null,
      },
    },
    studentInfo: {
      studentId: {
        type: String,
        unique: true,
        sparse: true, // Allow null values to be unique
      },
      major: String,
      year: Number,
      gpa: Number,
      enrollmentDate: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["active", "inactive", "graduated", "suspended"],
        default: "active",
      },
    },
    teacherInfo: {
      teacherId: {
        type: String,
        unique: true,
        sparse: true,
      },
      department: String,
      position: String,
      specialization: [String],
      hireDate: Date,
      office: String,
      phoneExtension: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "studentInfo.studentId": 1 });
userSchema.index({ "teacherInfo.teacherId": 1 });

// Pre-save middleware to hash password
userSchema.pre<IUserDocument>(
  "save",
  async function (this: IUserDocument, next: any) {
    if (!this.isModified("password")) return next();

    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error as Error);
    }
  }
);

// Update the updatedAt field before saving
userSchema.pre<IUserDocument>(
  "save",
  function (this: IUserDocument, next: any) {
    this.updatedAt = new Date();
    next();
  }
);

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate auth token
userSchema.methods.generateAuthToken = function (): string {
  // This will be implemented with JWT
  return "";
};

// Instance method to get JSON representation
userSchema.methods.toJSON = function (): Partial<IUser> {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function (identifier: string) {
  // Always select password field for login
  return this.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password");
};

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUserDocument) {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;

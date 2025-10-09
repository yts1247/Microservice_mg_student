import User from "../models/User";
import { generateToken } from "../middleware/auth";
import logger from "../config/logger";
import {
  IUser,
  IUserDocument,
  IRegisterRequest,
  IAuthResponse,
  IPaginatedResponse,
  IUserStats,
} from "../types/user.types";

interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

class UserService {
  async registerUser(
    userData: IRegisterRequest
  ): Promise<{ user: Partial<IUser>; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmailOrUsername(userData.email);
      if (existingUser) {
        throw new Error("User with this email or username already exists");
      }

      // Generate student/teacher ID if role is specified
      if (userData.role === "student") {
        userData.studentInfo = {
          ...userData.studentInfo,
          studentId: await this.generateStudentId(),
          status: "active",
        };
      } else if (userData.role === "teacher") {
        userData.teacherInfo = {
          ...userData.teacherInfo,
          teacherId: await this.generateTeacherId(),
        };
      }

      const user = new User(userData);
      await user.save();

      logger.info(`New user registered: ${user.email}`);

      // Generate token
      const token = generateToken(user._id as string);

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error: any) {
      logger.error("User registration error:", error);
      throw error;
    }
  }

  async loginUser(
    identifier: string,
    password: string
  ): Promise<{ user: Partial<IUser>; token: string }> {
    try {
      // Find user by email or username and include password for comparison
      const user = await User.findByEmailOrUsername(identifier);
      logger.debug(
        `[loginUser] identifier: ${identifier}, found user: ${!!user}`
      );

      if (!user) {
        logger.debug(
          `[loginUser] User not found for identifier: ${identifier}`
        );
        throw new Error("Invalid credentials");
      }

      if (!user.isActive) {
        logger.debug(`[loginUser] User is not active: ${identifier}`);
        throw new Error("Account is deactivated");
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      logger.debug(`[loginUser] Password match: ${isPasswordMatch}`);
      if (!isPasswordMatch) {
        logger.debug(
          `[loginUser] Password does not match for user: ${identifier}`
        );
        throw new Error("Invalid credentials");
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      // Generate token
      const token = generateToken(user._id as string);

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error: any) {
      logger.error("User login error:", error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUserDocument> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error: any) {
      logger.error("Get user error:", error);
      throw error;
    }
  }

  async updateUserProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUserDocument> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      logger.info(`User profile updated: ${user.email}`);
      return user;
    } catch (error: any) {
      logger.error("Update user profile error:", error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      const user = await User.findById(userId).select("+password");
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
      return { message: "Password changed successfully" };
    } catch (error: any) {
      logger.error("Change password error:", error);
      throw error;
    }
  }

  async getAllUsers(
    filters: UserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    users: IUserDocument[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query: any = {};

      // Apply filters
      if (filters.role) {
        query.role = filters.role;
      }
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      if (filters.search) {
        query.$or = [
          { "profile.firstName": { $regex: filters.search, $options: "i" } },
          { "profile.lastName": { $regex: filters.search, $options: "i" } },
          { email: { $regex: filters.search, $options: "i" } },
          { username: { $regex: filters.search, $options: "i" } },
        ];
      }

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      };
    } catch (error: any) {
      logger.error("Get all users error:", error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<IUserDocument> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      logger.info(`User deactivated: ${user.email}`);
      return user;
    } catch (error: any) {
      logger.error("Deactivate user error:", error);
      throw error;
    }
  }

  async activateUser(userId: string): Promise<IUserDocument> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: true },
        { new: true }
      );

      if (!user) {
        throw new Error("User not found");
      }

      logger.info(`User activated: ${user.email}`);
      return user;
    } catch (error: any) {
      logger.error("Activate user error:", error);
      throw error;
    }
  }

  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ role: "student" });
    return `STU${year}${String(count + 1).padStart(4, "0")}`;
  }

  private async generateTeacherId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ role: "teacher" });
    return `TEA${year}${String(count + 1).padStart(4, "0")}`;
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    roleDistribution: Array<{ _id: string; count: number }>;
  }> {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      return {
        totalUsers,
        activeUsers,
        roleDistribution: stats,
      };
    } catch (error: any) {
      logger.error("Get user stats error:", error);
      throw error;
    }
  }
}

export default new UserService();

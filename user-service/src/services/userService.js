const User = require("../models/User");
const { generateToken } = require("../middleware/auth");
const logger = require("../config/logger");

class UserService {
  async registerUser(userData) {
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
      const token = generateToken(user._id);

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      logger.error("User registration error:", error);
      throw error;
    }
  }

  async loginUser(identifier, password) {
    try {
      // Find user by email or username and include password for comparison
      const user = await User.findByEmailOrUsername(identifier).select(
        "+password"
      );

      if (!user) {
        throw new Error("Invalid credentials");
      }

      if (!user.isActive) {
        throw new Error("Account is deactivated");
      }

      // Check password
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        throw new Error("Invalid credentials");
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${user.email}`);

      // Generate token
      const token = generateToken(user._id);

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      logger.error("User login error:", error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      logger.error("Get user error:", error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
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
    } catch (error) {
      logger.error("Update user profile error:", error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
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
    } catch (error) {
      logger.error("Change password error:", error);
      throw error;
    }
  }

  async getAllUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const query = {};

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
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      logger.error("Get all users error:", error);
      throw error;
    }
  }

  async deactivateUser(userId) {
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
    } catch (error) {
      logger.error("Deactivate user error:", error);
      throw error;
    }
  }

  async activateUser(userId) {
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
    } catch (error) {
      logger.error("Activate user error:", error);
      throw error;
    }
  }

  async generateStudentId() {
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ role: "student" });
    return `STU${year}${String(count + 1).padStart(4, "0")}`;
  }

  async generateTeacherId() {
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ role: "teacher" });
    return `TEA${year}${String(count + 1).padStart(4, "0")}`;
  }

  async getUserStats() {
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
    } catch (error) {
      logger.error("Get user stats error:", error);
      throw error;
    }
  }
}

module.exports = new UserService();

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import User from "../models/User";
import { RBACService } from "../services/rbacService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Load proto definition
const PROTO_PATH = path.join(__dirname, "../../../protos/user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition) as any;

/**
 * gRPC User Service Implementation
 * Handles user management and authentication via gRPC
 */
export class UserGRPCService {
  private server: grpc.Server;

  constructor() {
    this.server = new grpc.Server();
    this.addServices();
  }

  private addServices(): void {
    this.server.addService(userProto.user.UserService.service, {
      // Authentication methods
      Login: this.login.bind(this),
      Register: this.register.bind(this),
      ValidateToken: this.validateToken.bind(this),
      RefreshToken: this.refreshToken.bind(this),

      // User management methods
      GetUser: this.getUser.bind(this),
      UpdateUser: this.updateUser.bind(this),
      DeleteUser: this.deleteUser.bind(this),
      ListUsers: this.listUsers.bind(this),

      // RBAC methods
      AssignRole: this.assignRole.bind(this),
      RemoveRole: this.removeRole.bind(this),
      GetUserPermissions: this.getUserPermissions.bind(this),
      CheckPermission: this.checkPermission.bind(this),
    });
  }

  // Authentication Methods
  private async login(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { username, password } = call.request;

      // Find user with password field
      const foundUser = await User.findByEmailOrUsername(username);
      const user = foundUser
        ? await User.findById(foundUser._id).populate({
            path: "roles",
            populate: {
              path: "permissions",
              model: "Permission",
            },
          })
        : null;

      if (!user || !user.isActive) {
        return callback(null, {
          success: false,
          message: "Invalid credentials or account inactive",
          user: null,
          token: "",
          refresh_token: "",
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return callback(null, {
          success: false,
          message: "Invalid credentials",
          user: null,
          token: "",
          refresh_token: "",
        });
      }

      // Generate tokens
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" }
      );

      const refreshToken = jwt.sign(
        { id: user._id, type: "refresh" },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Convert user to proto format
      const userProto = this.convertUserToProto(user);

      callback(null, {
        success: true,
        message: "Login successful",
        user: userProto,
        token,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      callback(null, {
        success: false,
        message: "Internal server error",
        user: null,
        token: "",
        refresh_token: "",
      });
    }
  }

  private async register(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        role,
        profile,
        student_info,
        teacher_info,
      } = call.request;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return callback(null, {
          success: false,
          message: "User already exists with this email or username",
          user: null,
          token: "",
          refresh_token: "",
        });
      }

      // Create new user
      const userData: any = {
        username,
        email,
        password,
        role: role || "student",
        profile: {
          firstName: profile.first_name,
          lastName: profile.last_name,
          phone: profile.phone,
          dateOfBirth: profile.date_of_birth
            ? new Date(profile.date_of_birth.seconds * 1000)
            : undefined,
          avatar: profile.avatar,
          address: profile.address
            ? {
                street: profile.address.street,
                city: profile.address.city,
                state: profile.address.state,
                zipCode: profile.address.zip_code,
                country: profile.address.country,
              }
            : undefined,
        },
      };

      // Add role-specific info
      if (student_info) {
        userData.studentInfo = {
          studentId: student_info.student_id,
          major: student_info.major,
          year: student_info.year,
          gpa: student_info.gpa,
          enrollmentDate: student_info.enrollment_date
            ? new Date(student_info.enrollment_date.seconds * 1000)
            : new Date(),
          status: student_info.status || "active",
        };
      }

      if (teacher_info) {
        userData.teacherInfo = {
          teacherId: teacher_info.teacher_id,
          department: teacher_info.department,
          position: teacher_info.position,
          specialization: teacher_info.specialization || [],
          hireDate: teacher_info.hire_date
            ? new Date(teacher_info.hire_date.seconds * 1000)
            : undefined,
          office: teacher_info.office,
          phoneExtension: teacher_info.phone_extension,
        };
      }

      const user = new User(userData);
      await user.save();

      // Assign default role based on user role
      const defaultRoleMap: Record<string, string> = {
        student: "student",
        teacher: "instructor",
        admin: "admin",
      };

      const defaultRole = defaultRoleMap[role] || "student";
      await RBACService.assignRoleToUser(user._id.toString(), defaultRole);

      // Generate tokens
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" }
      );

      const refreshToken = jwt.sign(
        { id: user._id, type: "refresh" },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: "7d" }
      );

      // Reload user with roles
      const userWithRoles = await User.findById(user._id).populate({
        path: "roles",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      const userProto = this.convertUserToProto(userWithRoles!);

      callback(null, {
        success: true,
        message: "Registration successful",
        user: userProto,
        token,
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      callback(null, {
        success: false,
        message: "Registration failed",
        user: null,
        token: "",
        refresh_token: "",
      });
    }
  }

  private async validateToken(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { token } = call.request;

      if (!token) {
        return callback(null, {
          valid: false,
          user: null,
          message: "Token is required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      const user = await User.findById(decoded.id).populate({
        path: "roles",
        populate: {
          path: "permissions",
          model: "Permission",
        },
      });

      if (!user || !user.isActive) {
        return callback(null, {
          valid: false,
          user: null,
          message: "User not found or inactive",
        });
      }

      const userProto = this.convertUserToProto(user);

      callback(null, {
        valid: true,
        user: userProto,
        message: "Token is valid",
      });
    } catch (error) {
      callback(null, {
        valid: false,
        user: null,
        message: "Invalid token",
      });
    }
  }

  // RBAC Methods
  private async checkPermission(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { user_id, resource, action } = call.request;

      const hasPermission = await RBACService.userHasPermission(
        user_id,
        resource,
        action
      );

      callback(null, {
        allowed: hasPermission,
        message: hasPermission ? "Permission granted" : "Permission denied",
      });
    } catch (error) {
      console.error("Check permission error:", error);
      callback(null, {
        allowed: false,
        message: "Error checking permission",
      });
    }
  }

  private async assignRole(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const { user_id, role_id } = call.request;

      const success = await RBACService.assignRoleToUser(user_id, role_id);

      callback(null, {
        success,
        message: success
          ? "Role assigned successfully"
          : "Failed to assign role",
      });
    } catch (error) {
      console.error("Assign role error:", error);
      callback(null, {
        success: false,
        message: "Error assigning role",
      });
    }
  }

  // Helper method to convert User model to proto format
  private convertUserToProto(user: any): any {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      roles: (user.roles || []).map((role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        is_active: role.is_active,
        permissions: (role.permissions || []).map((permission: any) => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
        })),
      })),
      is_active: user.isActive,
      last_login: user.lastLogin
        ? {
            seconds: Math.floor(user.lastLogin.getTime() / 1000),
            nanos: (user.lastLogin.getTime() % 1000) * 1000000,
          }
        : null,
      profile: {
        first_name: user.profile.firstName,
        last_name: user.profile.lastName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
        date_of_birth: user.profile.dateOfBirth
          ? {
              seconds: Math.floor(user.profile.dateOfBirth.getTime() / 1000),
              nanos: (user.profile.dateOfBirth.getTime() % 1000) * 1000000,
            }
          : null,
        address: user.profile.address
          ? {
              street: user.profile.address.street,
              city: user.profile.address.city,
              state: user.profile.address.state,
              zip_code: user.profile.address.zipCode,
              country: user.profile.address.country,
            }
          : null,
      },
      student_info: user.studentInfo
        ? {
            student_id: user.studentInfo.studentId,
            major: user.studentInfo.major,
            year: user.studentInfo.year,
            gpa: user.studentInfo.gpa,
            enrollment_date: user.studentInfo.enrollmentDate
              ? {
                  seconds: Math.floor(
                    user.studentInfo.enrollmentDate.getTime() / 1000
                  ),
                  nanos:
                    (user.studentInfo.enrollmentDate.getTime() % 1000) *
                    1000000,
                }
              : null,
            status: user.studentInfo.status,
          }
        : null,
      teacher_info: user.teacherInfo
        ? {
            teacher_id: user.teacherInfo.teacherId,
            department: user.teacherInfo.department,
            position: user.teacherInfo.position,
            specialization: user.teacherInfo.specialization,
            hire_date: user.teacherInfo.hireDate
              ? {
                  seconds: Math.floor(
                    user.teacherInfo.hireDate.getTime() / 1000
                  ),
                  nanos: (user.teacherInfo.hireDate.getTime() % 1000) * 1000000,
                }
              : null,
            office: user.teacherInfo.office,
            phone_extension: user.teacherInfo.phoneExtension,
          }
        : null,
      created_at: user.createdAt
        ? {
            seconds: Math.floor(user.createdAt.getTime() / 1000),
            nanos: (user.createdAt.getTime() % 1000) * 1000000,
          }
        : null,
      updated_at: user.updatedAt
        ? {
            seconds: Math.floor(user.updatedAt.getTime() / 1000),
            nanos: (user.updatedAt.getTime() % 1000) * 1000000,
          }
        : null,
    };
  }

  // Add other methods (getUser, updateUser, deleteUser, listUsers, etc.)
  private async getUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for getting user
    callback(null, { success: false, message: "Not implemented yet" });
  }

  private async updateUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for updating user
    callback(null, { success: false, message: "Not implemented yet" });
  }

  private async deleteUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for deleting user
    callback(null, { success: false, message: "Not implemented yet" });
  }

  private async listUsers(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for listing users
    callback(null, { success: false, message: "Not implemented yet" });
  }

  private async removeRole(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for removing role
    callback(null, { success: false, message: "Not implemented yet" });
  }

  private async getUserPermissions(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for getting user permissions
    callback(null, { success: false, permissions: [] });
  }

  private async refreshToken(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    // Implementation for refreshing token
    callback(null, { success: false, message: "Not implemented yet" });
  }

  public start(port: number = 50051): void {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error("Failed to start gRPC server:", error);
          return;
        }
        console.log(`User gRPC service started on port ${port}`);
        this.server.start();
      }
    );
  }

  public stop(): void {
    this.server.forceShutdown();
  }
}

export default UserGRPCService;

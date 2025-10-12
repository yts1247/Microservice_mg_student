import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";

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
 * gRPC User Service Client
 * Used by other services to communicate with User service
 */
export class UserGRPCClient {
  private client: any;

  constructor(serviceUrl: string = "localhost:50051") {
    this.client = new userProto.user.UserService(
      serviceUrl,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * Validate JWT token via gRPC
   */
  async validateToken(
    token: string
  ): Promise<{ valid: boolean; user?: any; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.ValidateToken({ token }, (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<{ allowed: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.CheckPermission(
        { user_id: userId, resource, action },
        (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        }
      );
    });
  }

  /**
   * Get user by ID
   */
  async getUser(
    userId: string
  ): Promise<{ success: boolean; user?: any; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.GetUser({ id: userId }, (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(
    userId: string
  ): Promise<{ success: boolean; permissions: string[] }> {
    return new Promise((resolve, reject) => {
      this.client.GetUserPermissions(
        { user_id: userId },
        (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        }
      );
    });
  }

  /**
   * Login user
   */
  async login(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.Login({ username, password }, (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * Register user
   */
  async register(userData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.Register(userData, (error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      this.client.AssignRole(
        { user_id: userId, role_id: roleId },
        (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        }
      );
    });
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// Singleton instance
let userGRPCClient: UserGRPCClient | null = null;

export const getUserGRPCClient = (serviceUrl?: string): UserGRPCClient => {
  if (!userGRPCClient) {
    userGRPCClient = new UserGRPCClient(serviceUrl);
  }
  return userGRPCClient;
};

export default UserGRPCClient;

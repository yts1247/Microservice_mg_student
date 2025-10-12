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
 * gRPC Client for API Gateway
 * Used to communicate with User service for authentication and authorization
 */
export class GRPCUserClient {
  private client: any;

  constructor(
    serviceUrl: string = process.env.USER_SERVICE_GRPC_URL || "localhost:50051"
  ) {
    // Initialize gRPC client
    this.client = new userProto.user.UserService(
      serviceUrl,
      grpc.credentials.createInsecure() // Use secure credentials in production
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
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

// Singleton instance
let grpcUserClient: GRPCUserClient | null = null;

export const getGRPCUserClient = (): GRPCUserClient => {
    // Lazy initialization
  if (!grpcUserClient) {
    // Initialize gRPC client
    grpcUserClient = new GRPCUserClient();
  }
  // if has exits return it
  return grpcUserClient;
};

export default GRPCUserClient;

# RBAC System Integration Documentation

## Overview
Hệ thống Role-Based Access Control (RBAC) đã được tích hợp đầy đủ vào Student Management System với các tính năng:

- ✅ **Hệ thống phân quyền**: Permission và Role models với middleware authentication/authorization
- ✅ **gRPC Communication**: Tối ưu giao tiếp giữa các services bằng gRPC
- ✅ **Message Broker**: Hệ thống logging với Redis/RabbitMQ
- ✅ **Frontend RBAC**: React components với permission-based UI
- ✅ **API Gateway**: Tích hợp RBAC middleware và gRPC clients

## Architecture

### 1. RBAC System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  User Service   │────│     MongoDB     │
│  RBAC Middleware│    │  RBAC Service   │    │  Users/Roles/   │
│  gRPC Client    │    │  gRPC Server    │    │  Permissions    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │ Message Broker  │              │
         └──────────────│ Redis/RabbitMQ  │──────────────┘
                        │   Log System    │
                        └─────────────────┘
```

### 2. Service Communication Flow
```
Frontend → API Gateway → gRPC → User Service → MongoDB
    ↓           ↓                     ↓           ↓
Permission  Auth Check         Role/Permission  Database
Validation   + Logging            Validation    Storage
```

## Implementation Details

### User Service (RBAC Core)

#### Models
- **Permission**: `user-service/src/models/Permission.ts`
- **Role**: `user-service/src/models/Role.ts`
- **User**: Enhanced with roles and permissions

#### gRPC Services
- **Proto Definition**: `protos/user.proto`
- **Server**: `user-service/src/grpc/userGrpcService.ts`
- **Client**: `user-service/src/grpc/userGrpcClient.ts`

#### Key Endpoints
```typescript
// Authentication
rpc Login(LoginRequest) returns (LoginResponse);
rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);

// Authorization
rpc CheckPermission(CheckPermissionRequest) returns (CheckPermissionResponse);
rpc GetUserPermissions(GetUserPermissionsRequest) returns (GetUserPermissionsResponse);
```

#### Message Broker Integration
- **Service**: `user-service/src/services/messageBrokerService.ts`
- **Enhanced Logger**: `user-service/src/services/enhancedLogger.ts`
- **Features**: Real-time logging, audit trails, statistics

### API Gateway (RBAC Middleware)

#### Middleware Components
- **Authentication**: `api-gateway/src/middleware/rbac.ts`
  - Token validation via gRPC
  - User context injection
  - Request logging

- **Authorization**: Permission-based route protection
  ```typescript
  app.use("/api/courses", 
    authenticateToken,
    requirePermission(PermissionResource.COURSE, PermissionAction.READ),
    serviceProxies.courses
  );
  ```

#### gRPC Client
- **Client**: `api-gateway/src/services/grpcUserClient.ts`
- **Methods**: validateToken, checkPermission, getUserPermissions

### Frontend (React RBAC)

#### Context System
- **RBAC Context**: `admin-frontend/src/contexts/RBACContext.tsx`
- **User permissions and roles management**

#### Components
- **RBAC Guard**: `admin-frontend/src/components/RBACGuard.tsx`
  - Conditional rendering based on permissions
  - Role-based component access
  - HOC wrapper for protected components

#### Navigation
- **Config**: `admin-frontend/src/config/navigation.tsx`
- **Permission-based menu items**
- **Dynamic route access control**

## Default Roles & Permissions

### System Roles
```typescript
SUPER_ADMIN: 'super_admin'    // Full system access
ADMIN: 'admin'                // Administrative functions
TEACHER: 'teacher'            // Course and student management
STUDENT: 'student'            // Limited course access
MODERATOR: 'moderator'        // Content moderation
VIEWER: 'viewer'              // Read-only access
```

### Permission Structure
```typescript
// Resources
USER, STUDENT, TEACHER, ADMIN, COURSE, SCHEDULE, 
ENROLLMENT, GRADE, ATTENDANCE, REPORT, SYSTEM, SETTING

// Actions
CREATE, READ, UPDATE, DELETE, MANAGE, APPROVE, REJECT,
ASSIGN, UNASSIGN, VIEW_ALL, EXPORT, IMPORT
```

## Security Features

### 1. JWT Token Management
- Secure token generation and validation
- Token expiration and refresh
- Role-based token claims

### 2. Permission Checking
- Resource-based authorization
- Action-level permission control
- Conditional permissions with context

### 3. Audit Logging
- All requests logged via Message Broker
- User action tracking
- Performance monitoring
- Real-time security alerts

## Usage Examples

### Frontend Permission Check
```tsx
import { RBACGuard, usePermission } from '@/components/RBACGuard';

// Component guard
<RBACGuard 
  resource={PermissionResource.COURSE} 
  action={PermissionAction.CREATE}
>
  <CreateCourseButton />
</RBACGuard>

// Hook usage
const canCreateCourse = usePermission(PermissionResource.COURSE, PermissionAction.CREATE);
```

### API Gateway Protection
```typescript
// Protect entire route
app.use("/api/courses", 
  authenticateToken,
  requirePermission(PermissionResource.COURSE, PermissionAction.READ),
  serviceProxies.courses
);

// Custom middleware
app.use("/api/admin", 
  authenticateToken,
  requireRole(SYSTEM_ROLES.ADMIN),
  adminRoutes
);
```

### Backend Service Integration
```typescript
// User service - permission check
const hasPermission = await rbacService.checkUserPermission(
  userId, 
  PermissionResource.COURSE, 
  PermissionAction.UPDATE
);

// Message broker logging
await messageBrokerService.publishLog({
  level: 'info',
  message: 'User action performed',
  userId,
  action: 'course_update',
  resource: 'course',
  metadata: { courseId, changes }
});
```

## Development Setup

### 1. Environment Configuration
All services configured with proper environment variables for:
- JWT secrets
- gRPC endpoints  
- Redis/RabbitMQ connections
- RBAC settings

### 2. Database Seeding
Default roles and permissions should be seeded on first run:
```typescript
// Create default system roles
await seedDefaultRoles();
await seedDefaultPermissions();
await assignDefaultPermissions();
```

### 3. Testing
- Unit tests for RBAC middleware
- Integration tests for gRPC communication
- End-to-end tests for permission flows

## Performance Optimizations

### 1. gRPC Benefits
- Binary protocol for faster serialization
- HTTP/2 multiplexing for concurrent requests
- Type-safe service definitions
- Built-in load balancing

### 2. Caching Strategy
- Permission caching in Redis
- User context caching
- Role hierarchy caching

### 3. Message Broker Advantages
- Asynchronous logging for better performance
- Decoupled audit system
- Real-time monitoring capabilities
- Scalable log processing

## Monitoring & Metrics

### Key Metrics
- Authentication success/failure rates
- Permission check performance
- gRPC request latencies
- Message broker throughput
- Database query performance

### Logging Levels
- **INFO**: Normal operations
- **WARN**: Permission denials
- **ERROR**: Authentication failures
- **DEBUG**: Detailed request flows

## Next Steps

1. **Testing**: Comprehensive test suite for all RBAC components
2. **Documentation**: API documentation with OpenAPI/Swagger
3. **Monitoring**: Integration with monitoring tools (Prometheus, Grafana)
4. **Deployment**: Docker containers and CI/CD pipelines
5. **Security**: Security audit and penetration testing

## Files Created/Modified

### Core RBAC Files
- `user-service/src/types/rbac.types.ts`
- `user-service/src/models/Permission.ts`
- `user-service/src/models/Role.ts` 
- `user-service/src/middleware/rbac.ts`
- `user-service/src/services/rbacService.ts`

### gRPC Implementation
- `protos/user.proto`
- `user-service/src/grpc/userGrpcService.ts`
- `user-service/src/grpc/userGrpcClient.ts`
- `api-gateway/src/services/grpcUserClient.ts`

### Message Broker System
- `user-service/src/services/messageBrokerService.ts`
- `user-service/src/services/enhancedLogger.ts`

### Frontend RBAC
- `admin-frontend/src/types/rbac.types.ts`
- `admin-frontend/src/contexts/RBACContext.tsx`
- `admin-frontend/src/components/RBACGuard.tsx`
- `admin-frontend/src/config/navigation.tsx`

### API Gateway Integration
- `api-gateway/src/types/rbac.types.ts`
- `api-gateway/src/middleware/rbac.ts`
- `api-gateway/src/services/grpcUserClient.ts`

Hệ thống RBAC đã được triển khai hoàn chỉnh với tất cả các tính năng được yêu cầu!
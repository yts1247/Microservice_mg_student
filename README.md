# Student Management System - Microservices with RBAC & gRPC

## 🌟 Tổng quan
Hệ thống microservice quản lý học sinh hiện đại với **TypeScript**, **RBAC** (Role-Based Access Control), **gRPC**, và **Message Broker**. Được thiết kế theo kiến trúc phân tán, mỗi service độc lập và có thể scale riêng biệt.

### ✨ Tính năng nổi bật
- 🔐 **RBAC System**: Hệ thống phân quyền dựa trên vai trò và quyền hạn
- ⚡ **gRPC Communication**: Tối ưu hiệu suất giao tiếp giữa các services
- 📨 **Message Broker**: Hệ thống logging real-time với Redis/RabbitMQ
- 🎯 **TypeScript**: Full type safety và enhanced development experience
- 🔄 **Real-time Logging**: Audit trails và monitoring system
- 🛡️ **Security**: JWT authentication với permission-based authorization

## Kiến trúc hệ thống

### 🏗️ Services Architecture

1. **User Service** (Port: 3001, gRPC: 50051)
   - 👥 Quản lý thông tin học sinh và giáo viên
   - 🔐 **RBAC Core**: Roles, Permissions, Authentication
   - 🔒 JWT authentication và authorization
   - 📡 **gRPC Server**: User authentication services
   - 📊 **Message Broker Integration**: Enhanced logging system
   - 🗄️ Database: MongoDB

2. **Course Service** (Port: 3002, gRPC: 50052)
   - 📚 Quản lý thông tin khóa học, môn học
   - 📖 Quản lý giáo trình và tài liệu
   - 🔐 **RBAC Protected**: Permission-based access control
   - 📡 **gRPC Server**: Course management services
   - 🗄️ Database: MongoDB

3. **Schedule Service** (Port: 3003, gRPC: 50053)
   - 📅 Quản lý lịch học, thời khóa biểu
   - ⚡ Xử lý xung đột lịch học
   - 🔐 **RBAC Protected**: Role-based schedule access
   - 📡 **gRPC Server**: Schedule management services
   - 🗄️ Database: MongoDB

4. **Enrollment Service** (Port: 3004, gRPC: 50054)
   - 📝 Quản lý việc đăng ký khóa học
   - 📈 Theo dõi tiến độ học tập
   - 🔐 **RBAC Protected**: Enrollment permissions
   - 📡 **gRPC Server**: Enrollment services
   - 🗄️ Database: MongoDB

5. **API Gateway** (Port: 3000)
   - 🌐 Route requests với RBAC middleware
   - ⚖️ Load balancing và rate limiting
   - 🔐 **RBAC Authentication**: Token validation
   - 📡 **gRPC Clients**: Communication with all services
   - 📊 **Request Logging**: Audit trail system

6. **Message Broker System**
   - 📨 **Redis**: Primary message broker for logging
   - 🐰 **RabbitMQ**: Alternative message queue (optional)
   - 📈 **Real-time Monitoring**: System statistics
   - 🔍 **Audit Logs**: User action tracking

### 🛠️ Công nghệ sử dụng
- **Backend**: Node.js, Express.js, **TypeScript**
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Authorization**: **RBAC** (Role-Based Access Control)
- **Communication**: **gRPC** với Protocol Buffers
- **Message Broker**: **Redis** / RabbitMQ cho logging system
- **Type Safety**: TypeScript với strict mode
- **Development**: ts-node-dev, nodemon
- **Build Tool**: TypeScript compiler (tsc)
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI  
- **Containerization**: Docker & Docker Compose
- **Frontend**: React.js với Ant Design, RBAC Context
- **Monitoring**: Enhanced logging với audit trails

### 🔄 Luồng dữ liệu với RBAC & gRPC
1. **Client Request**: Client gửi request với JWT token đến API Gateway
2. **RBAC Authentication**: API Gateway xác thực token qua gRPC với User Service
3. **Permission Check**: Kiểm tra quyền hạn dựa trên resource và action
4. **Service Communication**: API Gateway gọi service tương ứng qua gRPC
5. **Business Logic**: Service xử lý logic và tương tác với database
6. **Audit Logging**: Message Broker ghi log audit và monitoring
7. **Response**: Kết quả được trả về thông qua API Gateway với security headers

```
Frontend → API Gateway → gRPC → Service → MongoDB
    ↓         ↓ RBAC        ↓        ↓        ↓
Permission  Auth Check   Business  Data     Audit
 Context   + Logging     Logic    Storage   Logs
```

## 🚀 Quick Start

### 📋 Yêu cầu hệ thống
- Node.js 18+
- MongoDB 6.0+
- Redis 6.0+
- Docker & Docker Compose
- npm hoặc yarn

### ⚡ Quick Setup (Recommended)
```bash
# 1. Clone và setup
git clone <repository-url>
cd microservice_mg_student

# 2. Start với Docker Compose
docker-compose up -d

# 3. Kiểm tra hệ thống
./test-rbac-system.sh   # Linux/Mac
# hoặc
./test-rbac-system.ps1  # Windows PowerShell

# 4. Access services
# API Gateway: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
# Admin Panel: http://localhost:3008
```

### Khởi chạy hệ thống

### Cài đặt dependencies (yarn)
```bash
# Clone repository
git clone <repository-url>
cd microservice_be

# Cài đặt dependencies cho từng service (dùng yarn)
cd user-service && yarn && cd ..
cd course-service && yarn && cd ..
cd schedule-service && yarn && cd ..
cd enrollment-service && yarn && cd ..
cd api-gateway && yarn && cd ..
cd admin-frontend && yarn && cd ..
```

#### Cấu hình môi trường
```bash
# Copy và cấu hình file .env cho từng service
cp user-service/.env.sample user-service/.env
cp course-service/.env.sample course-service/.env
cp schedule-service/.env.sample schedule-service/.env
cp enrollment-service/.env.sample enrollment-service/.env
cp api-gateway/.env.sample api-gateway/.env
```

#### Development mode (yarn)
```bash
# Chạy từng service riêng biệt trong development mode
cd user-service && yarn dev
cd course-service && yarn dev
cd schedule-service && yarn dev
cd enrollment-service && yarn dev
cd api-gateway && yarn dev
cd admin-frontend && yarn dev
```

#### Production build (yarn)
```bash
# Build and start services
cd user-service && yarn build && yarn start
cd course-service && yarn build && yarn start
cd schedule-service && yarn build && yarn start
cd enrollment-service && yarn build && yarn start
cd api-gateway && yarn build && yarn start
cd admin-frontend && yarn build && yarn start
```

#### Type checking (yarn)
```bash
# Kiểm tra TypeScript types
cd user-service && yarn type-check
cd course-service && yarn type-check
cd schedule-service && yarn type-check
cd enrollment-service && yarn type-check
cd api-gateway && yarn type-check
cd admin-frontend && yarn type-check
```

### 🌐 Service Endpoints
- **API Gateway**: http://localhost:3000 *(Main entry point)*
- **Admin Frontend**: http://localhost:3008 *(RBAC-enabled UI)*
- **User Service**: http://localhost:3001 *(RBAC Core)*
- **Course Service**: http://localhost:3002 *(Protected)*
- **Schedule Service**: http://localhost:3003 *(Protected)*
- **Enrollment Service**: http://localhost:3004 *(Protected)*

### 📚 Documentation & Tools
- **API Documentation**: http://localhost:3000/api/docs
- **Health Checks**: http://localhost:3000/health
- **Admin Panel**: http://localhost:3008 *(Role-based navigation)*

## API Documentation
Sau khi khởi chạy, Swagger UI có sẵn tại:
- http://localhost:3000/api-docs (API Gateway)
- http://localhost:300x/api-docs (các service riêng lẻ)

## Cấu trúc dự án
```
microservice_be/
├── user-service/              # Service quản lý người dùng
│   ├── src/                   # TypeScript source code
│   │   ├── types/            # Type definitions
│   │   ├── controllers/      # Controllers
│   │   ├── models/           # MongoDB models
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── dist/                 # Compiled JavaScript (build output)
│   ├── package.json          # Dependencies và scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── .env.sample           # Environment variables template
├── course-service/           # Service quản lý khóa học (cùng cấu trúc)
├── schedule-service/         # Service quản lý lịch học (cùng cấu trúc)
├── enrollment-service/       # Service quản lý đăng ký (cùng cấu trúc)
├── api-gateway/             # API Gateway (cùng cấu trúc)
├── .gitignore               # Git ignore file (bảo mật)
├── docker-compose.yml       # Container orchestration
└── README.md               # Documentation
```

## Tính năng TypeScript
- ✅ **Full Type Safety**: Tất cả code được chuyển đổi sang TypeScript
- ✅ **Strict Mode**: TypeScript strict mode được bật
- ✅ **Interface Definitions**: Đầy đủ interfaces cho models và DTOs
- ✅ **Type Guards**: Type checking và validation
- ✅ **Generic Types**: Sử dụng generics cho API responses
- ✅ **Environment Safety**: Type-safe environment variables
- ✅ **Build Pipeline**: TypeScript compilation pipeline
- ✅ **Development Experience**: Hot reload với ts-node-dev

## 🔐 RBAC System Overview

### Default Roles
```typescript
SUPER_ADMIN: Full system access
ADMIN: Administrative functions
TEACHER: Course and student management  
STUDENT: Limited course access
MODERATOR: Content moderation
VIEWER: Read-only access
```

### Permission Structure
```typescript
// Resources: USER, COURSE, SCHEDULE, ENROLLMENT, etc.
// Actions: CREATE, READ, UPDATE, DELETE, MANAGE, etc.

// Example: Teacher role
permissions: [
  "course:read", "course:update", 
  "student:read", "schedule:manage"
]
```

### Frontend RBAC
```tsx
// Permission-based UI rendering
<RBACGuard resource="course" action="create">
  <CreateCourseButton />
</RBACGuard>

// Role-based navigation
const canAccessAdmin = useRole('admin');
```

## 🧪 Testing

### Integration Tests
```bash
# Test toàn bộ hệ thống RBAC
./test-rbac-system.sh      # Linux/Mac
./test-rbac-system.ps1     # Windows PowerShell

# Manual testing
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Test Coverage
- ✅ Authentication flow
- ✅ Permission validation
- ✅ gRPC communication
- ✅ Message broker logging
- ✅ Frontend RBAC components

## 📊 Monitoring & Logging

### Message Broker Logs
```bash
# Redis logs
redis-cli monitor

# View audit logs
redis-cli lrange audit_logs:info 0 -1
```

### Performance Metrics
- 🔒 Authentication success rates
- ⚡ gRPC request latencies  
- 📊 Permission check performance
- 📈 System resource usage

## Scripts NPM
Mỗi service có các scripts sau:
- `npm run dev` - Development mode với TypeScript hot reload
- `npm run build` - Build TypeScript to JavaScript  
- `npm start` - Chạy production build
- `npm run type-check` - Kiểm tra TypeScript types
- `npm test` - Chạy unit tests

## 📖 Documentation

- 📋 **[RBAC Implementation Guide](./RBAC_IMPLEMENTATION.md)** - Technical details
- 🚀 **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Setup instructions
- 📝 **[API Documentation](http://localhost:3000/api/docs)** - Interactive docs

---

## 🎯 Key Features Implemented

✅ **Complete RBAC System** - Role-based access control across all services  
✅ **gRPC Optimization** - High-performance inter-service communication  
✅ **Message Broker Logging** - Real-time audit trails with Redis/RabbitMQ  
✅ **Frontend RBAC** - Permission-based UI components and navigation  
✅ **Type Safety** - Full TypeScript implementation with strict mode  
✅ **Security** - JWT authentication with comprehensive authorization  
✅ **Monitoring** - Enhanced logging and performance metrics  
✅ **Testing** - Comprehensive test suite for all components

**Hệ thống đã sẵn sàng cho production với đầy đủ tính năng bảo mật và tối ưu hiệu suất!** 🚀
# Setup và Chạy Hệ Thống RBAC Microservices

## 🚀 Quick Start Guide

### 1. Prerequisites
```bash
# Yêu cầu hệ thống
- Node.js >= 16.x
- MongoDB >= 4.4
- Redis >= 6.x
- RabbitMQ >= 3.8 (optional)
- Docker & Docker Compose (recommended)
```

### 2. Environment Setup

#### Sao chép và cấu hình .env files:
```bash
# User Service
cp user-service/.env.example user-service/.env

# Course Service  
cp course-service/.env.example course-service/.env

# Schedule Service
cp schedule-service/.env.example schedule-service/.env

# Enrollment Service
cp enrollment-service/.env.example enrollment-service/.env

# API Gateway
cp api-gateway/.env.example api-gateway/.env
```

#### Cấu hình quan trọng trong .env:
```env
# JWT Configuration (PHẢI GIỐNG NHAU CHO TẤT CẢ SERVICES)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# MongoDB
MONGODB_URI=mongodb://localhost:27017/student_management

# Redis
REDIS_URL=redis://localhost:6379

# gRPC Ports
USER_GRPC_PORT=50051
COURSE_GRPC_PORT=50052
SCHEDULE_GRPC_PORT=50053
ENROLLMENT_GRPC_PORT=50054
```

### 3. Cài Đặt Dependencies

#### Cài đặt cho tất cả services:
```bash
# Root project
npm install

# Hoặc từng service riêng lẻ
cd user-service && npm install
cd ../course-service && npm install  
cd ../schedule-service && npm install
cd ../enrollment-service && npm install
cd ../api-gateway && npm install
```

### 4. Khởi Động Services

#### Option 1: Docker Compose (Recommended)
```bash
# Khởi động toàn bộ hệ thống
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng hệ thống
docker-compose down
```

#### Option 2: Manual Start
```bash
# Terminal 1: MongoDB + Redis
mongod
redis-server

# Terminal 2: User Service
cd user-service
npm run dev

# Terminal 3: Course Service  
cd course-service
npm run dev

# Terminal 4: Schedule Service
cd schedule-service  
npm run dev

# Terminal 5: Enrollment Service
cd enrollment-service
npm run dev

# Terminal 6: API Gateway
cd api-gateway
npm run dev
```

### 5. Kiểm Tra Health

#### Health Checks:
```bash
# API Gateway
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Course Service
curl http://localhost:3002/health

# Schedule Service
curl http://localhost:3003/health

# Enrollment Service  
curl http://localhost:3004/health
```

## 🔐 RBAC System Configuration

### 1. Default Roles & Permissions Setup

#### Tạo Default Data:
```bash
# Chạy seeding script (nếu có)
cd user-service
npm run seed

# Hoặc tạo manual qua API
curl -X POST http://localhost:3001/api/admin/seed-rbac \
  -H "Content-Type: application/json"
```

#### Default System Roles:
```typescript
SUPER_ADMIN: Full system access
ADMIN: Administrative functions  
TEACHER: Course and student management
STUDENT: Limited course access
MODERATOR: Content moderation
VIEWER: Read-only access
```

### 2. User Authentication Flow

#### Đăng ký User:
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "System Admin",
    "role": "admin"
  }'
```

#### Đăng nhập:
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com", 
    "password": "password123"
  }'
```

#### Sử dụng Token:
```bash
# Lưu token từ response login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Sử dụng trong requests
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Development

### 1. Code Structure

```
microservice_mg_student/
├── user-service/          # Core RBAC service
│   ├── src/
│   │   ├── models/        # Permission, Role, User models
│   │   ├── middleware/    # RBAC middleware
│   │   ├── services/      # Business logic
│   │   ├── grpc/         # gRPC server/client
│   │   └── types/        # TypeScript definitions
│   └── protos/           # gRPC proto files
├── api-gateway/          # API Gateway with RBAC
│   ├── src/
│   │   ├── middleware/   # Auth & logging middleware
│   │   ├── services/     # gRPC clients
│   │   └── types/       # Type definitions
└── other-services/       # Course, Schedule, Enrollment services
```

### 2. gRPC Services

#### Proto Files Location:
```
protos/
├── user.proto           # User authentication & RBAC
├── course.proto         # Course management  
├── schedule.proto       # Schedule operations
└── enrollment.proto     # Enrollment management
```

#### gRPC Service Ports:
```
User Service: 50051
Course Service: 50052  
Schedule Service: 50053
Enrollment Service: 50054
```

### 3. Database Schema

#### RBAC Collections:
```javascript
// Users
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  roles: [ObjectId], // References to Role collection
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Roles  
{
  _id: ObjectId,
  name: String,
  description: String,
  permissions: [ObjectId], // References to Permission collection
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Permissions
{
  _id: ObjectId,
  resource: String, // 'course', 'user', 'schedule', etc.
  action: String,   // 'create', 'read', 'update', 'delete'
  description: String,
  conditions: Object, // Optional conditions
  createdAt: Date,
  updatedAt: Date
}
```

## 📊 Monitoring & Logging

### 1. Message Broker Logs

#### Redis Logs:
```bash
# View Redis logs
redis-cli monitor

# Check message queues
redis-cli
> KEYS audit_logs:*
> LRANGE audit_logs:info 0 -1
```

#### RabbitMQ (Optional):
```bash
# Management UI
http://localhost:15672

# Default credentials: guest/guest
```

### 2. Application Logs

#### Service Logs:
```bash
# API Gateway logs
tail -f api-gateway/logs/combined.log

# User Service logs  
tail -f user-service/logs/combined.log

# Error logs
tail -f */logs/error.log
```

### 3. Performance Metrics

#### gRPC Metrics:
- Request latency
- Success/failure rates  
- Concurrent connections
- Message throughput

#### RBAC Metrics:
- Authentication success rate
- Permission check performance
- Token validation time
- Role assignment distribution

## 🔍 Testing

### 1. Unit Tests
```bash
# Run all tests
npm test

# Run service-specific tests
cd user-service && npm test
cd course-service && npm test
```

### 2. Integration Tests
```bash
# API integration tests
npm run test:integration

# gRPC service tests
npm run test:grpc

# RBAC flow tests
npm run test:rbac
```

### 3. Manual Testing

#### Test Authentication:
```bash
# Valid login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Invalid credentials
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'
```

#### Test Authorization:
```bash
# Access with proper permission
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer $VALID_TOKEN"

# Access without permission  
curl -X DELETE http://localhost:3000/api/courses/123 \
  -H "Authorization: Bearer $LIMITED_TOKEN"
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. gRPC Connection Errors:
```bash
# Check if gRPC services are running
netstat -an | grep 50051
netstat -an | grep 50052

# Test gRPC connectivity
grpc_cli call localhost:50051 UserService.ValidateToken 'token: "test"'
```

#### 2. JWT Token Issues:
```bash
# Verify JWT_SECRET is same across services
grep JWT_SECRET */.(env

# Check token expiration
node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64')))"
```

#### 3. Permission Denied Errors:
```bash
# Check user roles and permissions
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# Verify permission exists
curl -X GET http://localhost:3001/api/admin/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 4. Database Connection Issues:
```bash
# Check MongoDB connection
mongo --eval "db.stats()"

# Check Redis connection  
redis-cli ping
```

## 📦 Production Deployment

### 1. Docker Production:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production  
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Environment Variables:
```env
# Production settings
NODE_ENV=production
JWT_SECRET=very-secure-production-secret
MONGODB_URI=mongodb://mongo-cluster/student_management_prod
REDIS_URL=redis://redis-cluster:6379
```

### 3. Security Checklist:
- [ ] Change default JWT_SECRET
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up database authentication
- [ ] Enable rate limiting
- [ ] Configure monitoring alerts
- [ ] Set up log aggregation
- [ ] Implement backup strategy

## 📚 API Documentation

### Swagger Documentation:
```
API Gateway: http://localhost:3000/api/docs
User Service: http://localhost:3001/api/docs
Course Service: http://localhost:3002/api/docs
```

### Postman Collection:
Import the provided Postman collection for testing all endpoints with proper authentication flows.

---

**🎉 Hệ thống RBAC Microservices đã sẵn sàng hoạt động!**

Để hỗ trợ thêm, vui lòng kiểm tra:
- [RBAC_IMPLEMENTATION.md](./RBAC_IMPLEMENTATION.md) - Technical implementation details
- [API Documentation](http://localhost:3000/api/docs) - Interactive API docs
- Service logs for debugging information
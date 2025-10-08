# 🎓 Hệ thống Microservice Quản lý Học sinh - HOÀN CHỈNH

## ✨ Tổng quan

Hệ thống microservice hoàn chỉnh để quản lý học sinh, lịch học và khóa học được xây dựng với kiến trúc phân tán hiện đại.

## 🏗️ Kiến trúc Microservices

### 📦 Services đã hoàn thành

1. **🔐 User Service** (Port: 3001)
   - ✅ Đăng ký, đăng nhập, quản lý profile  
   - ✅ JWT Authentication & Authorization
   - ✅ Roles: Student, Teacher, Admin
   - ✅ Auto-generate Student/Teacher ID

2. **📚 Course Service** (Port: 3002)
   - ✅ Quản lý khóa học, môn học
   - ✅ Prerequisites, syllabus, capacity management
   - ✅ Tích hợp với User Service
   - ✅ Statistical endpoints

3. **📅 Schedule Service** (Port: 3003)
   - ✅ Quản lý lịch học, thời khóa biểu
   - ✅ Conflict detection và resolution
   - ✅ Attendance tracking
   - ✅ Room management

4. **📝 Enrollment Service** (Port: 3004)  
   - ✅ Quản lý đăng ký khóa học
   - ✅ Grade tracking và GPA calculation
   - ✅ Payment management
   - ✅ Progress tracking

5. **🌐 API Gateway** (Port: 3000)
   - ✅ Reverse proxy cho tất cả services
   - ✅ Rate limiting và security
   - ✅ Health checks và monitoring
   - ✅ Unified API documentation

### 🛠️ Công nghệ Stack

- **Backend**: Node.js 18+, Express.js
- **Database**: MongoDB 6.0+ với Mongoose ODM
- **Authentication**: JWT với bcrypt
- **Caching**: Redis
- **Documentation**: Swagger/OpenAPI 3.0
- **Containerization**: Docker & Docker Compose
- **Logging**: Winston
- **Proxy**: http-proxy-middleware

## 🚀 Khởi chạy hệ thống

### Yêu cầu hệ thống
- Node.js 18+
- MongoDB 6.0+
- Redis 7+
- Docker & Docker Compose (khuyến nghị)

### 🐳 Với Docker (Khuyến nghị)

```bash
# Clone và di chuyển vào thư mục
git clone <repository-url>
cd microservice_be

# Khởi chạy tất cả services
docker-compose up --build

# Chạy trong background
docker-compose up -d

# Xem logs realtime
docker-compose logs -f

# Dừng hệ thống
docker-compose down
```

### 💻 Development Mode

```bash
# Cài đặt dependencies cho tất cả services
npm run install-all

# Chạy tất cả services trong development mode
npm run dev-all

# Hoặc chạy từng service riêng
npm run dev-user      # User Service
npm run dev-course    # Course Service  
npm run dev-schedule  # Schedule Service
npm run dev-enrollment # Enrollment Service
npm run dev-gateway   # API Gateway
```

## 🔗 API Endpoints

### Thông qua API Gateway (http://localhost:3000)

#### 🔐 Authentication & Users
```bash
POST /api/users/register          # Đăng ký
POST /api/users/login             # Đăng nhập
GET  /api/users/profile           # Profile cá nhân
PUT  /api/users/profile           # Cập nhật profile
GET  /api/users                   # Danh sách users (Admin)
```

#### 📚 Courses
```bash
GET  /api/courses                 # Danh sách khóa học
POST /api/courses                 # Tạo khóa học (Teacher/Admin)
GET  /api/courses/:id             # Chi tiết khóa học
PUT  /api/courses/:id             # Cập nhật khóa học
GET  /api/courses/available       # Khóa học có sẵn
```

#### 📅 Schedules  
```bash
GET  /api/schedules               # Danh sách lịch học
POST /api/schedules               # Tạo lịch học (Teacher/Admin)
GET  /api/schedules/:id           # Chi tiết lịch học
GET  /api/schedules/my/schedules  # Lịch học của tôi
GET  /api/schedules/room/:room    # Lịch theo phòng
POST /api/schedules/check-conflicts # Kiểm tra xung đột
```

#### 📝 Enrollments
```bash
GET  /api/enrollments             # Danh sách đăng ký
POST /api/enrollments             # Đăng ký khóa học
GET  /api/enrollments/:id         # Chi tiết đăng ký
PUT  /api/enrollments/:id/grades  # Cập nhật điểm
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- API Gateway: http://localhost:3000/health
- User Service: http://localhost:3001/health  
- Course Service: http://localhost:3002/health
- Schedule Service: http://localhost:3003/health
- Enrollment Service: http://localhost:3004/health

### Service Status
```bash
GET /status  # Kiểm tra trạng thái tất cả services
```

## 📖 API Documentation

- **Tổng hợp**: http://localhost:3000/api-docs
- **User Service**: http://localhost:3001/api-docs (nếu chạy riêng)

## 💡 Ví dụ sử dụng

### 1. Đăng ký học sinh

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student01",
    "email": "student01@example.com", 
    "password": "Password123",
    "role": "student",
    "profile": {
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "phone": "+84901234567"
    }
  }'
```

### 2. Tạo khóa học

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "courseCode": "MATH101",
    "title": "Toán Cơ Bản", 
    "description": "Khóa học toán học cơ bản",
    "department": "Toán học",
    "credits": 3,
    "capacity": {"max": 50},
    "schedule": {
      "semester": "fall",
      "year": 2025
    }
  }'
```

### 3. Tạo lịch học

```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Toán Cơ Bản - Lớp A",
    "type": "class",
    "course": {
      "courseId": "COURSE_ID_HERE",
      "courseCode": "MATH101"
    },
    "timeSlot": {
      "startTime": "2025-01-15T09:00:00Z",
      "endTime": "2025-01-15T10:30:00Z"
    },
    "location": {
      "room": "A101",
      "building": "Tòa A"
    },
    "semester": {
      "name": "spring",
      "year": 2025
    }
  }'
```

## 🗂️ Cấu trúc Database

### User Collection
- username, email, password (hashed)
- role: student/teacher/admin
- profile: firstName, lastName, phone, address
- studentInfo/teacherInfo

### Course Collection  
- courseCode, title, description
- department, credits, level
- instructor, capacity, schedule
- syllabus, prerequisites

### Schedule Collection
- title, type, course reference
- timeSlot, location, semester
- participants, attendance
- recurrence patterns

### Enrollment Collection
- student reference, course reference
- enrollment status, grades
- attendance, progress tracking
- payment information

## 🔧 Troubleshooting

### Lỗi kết nối service
```bash
# Kiểm tra trạng thái containers
docker ps

# Xem logs service cụ thể
docker-compose logs user-service
docker-compose logs api-gateway

# Restart services
docker-compose restart
```

### Lỗi database
```bash
# Kiểm tra MongoDB
docker-compose logs mongodb

# Reset database
docker-compose down -v
docker-compose up --build
```

### Port conflicts
```bash
# Kiểm tra ports đang sử dụng
netstat -an | findstr :3000
netstat -an | findstr :3001

# Thay đổi ports trong .env files nếu cần
```

## 🎯 Tính năng nổi bật

### 🔒 Security
- JWT authentication với refresh tokens
- Role-based access control (RBAC)
- Rate limiting và request validation
- Password hashing với bcrypt
- Helmet.js security headers

### 📈 Performance  
- MongoDB indexing tối ưu
- Redis caching layer
- Compression middleware
- Connection pooling
- Health checks và auto-recovery

### 🔧 Developer Experience
- Hot reload với nodemon
- Comprehensive logging với Winston
- API documentation với Swagger
- Error handling và validation
- Docker containerization

### 📊 Business Logic
- Automatic conflict detection
- GPA calculation
- Attendance tracking  
- Prerequisites validation
- Payment management
- Progress monitoring

## 🚀 Production Deployment

### Environment Variables
Tạo `.env.production` cho mỗi service với:
```bash
NODE_ENV=production
MONGODB_URI=mongodb://prod-server:27017/database
JWT_SECRET=your-super-secure-secret
REDIS_URL=redis://prod-redis:6379
```

### Scaling
```bash
# Scale specific services
docker-compose up --scale user-service=3 --scale course-service=2

# Load balancer configuration needed for multiple instances
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

MIT License - xem file `LICENSE` để biết thêm chi tiết.

---

## 🎉 Kết luận

Hệ thống microservice quản lý học sinh đã **HOÀN THÀNH** với đầy đủ 5 services:

✅ **User Service** - Quản lý người dùng & authentication  
✅ **Course Service** - Quản lý khóa học  
✅ **Schedule Service** - Quản lý lịch học  
✅ **Enrollment Service** - Quản lý đăng ký  
✅ **API Gateway** - Gateway tổng hợp  

Hệ thống sẵn sàng để triển khai và sử dụng! 🚀
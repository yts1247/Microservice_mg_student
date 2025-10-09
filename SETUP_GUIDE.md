# Hướng dẫn sử dụng Hệ thống Microservice Quản lý Học sinh

## Cài đặt và khởi chạy

### 1. Yêu cầu hệ thống
- Node.js 18 trở lên
- MongoDB 6.0 trở lên  
- Docker và Docker Compose (khuyến nghị)
- Git

### 2. Clone và cài đặt

```bash
# Clone repository
git clone <repository-url>
cd microservice_be

# Cài đặt dependencies cho tất cả services
npm run install-all
```

### 3. Khởi chạy với Docker (Khuyến nghị)

```bash
# Build và khởi chạy tất cả services
docker-compose up --build

# Chạy trong background
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### 4. Khởi chạy thủ công (Development)

Đảm bảo MongoDB và Redis đang chạy trên máy local:

```bash
# Terminal 1: User Service
cd user-service
npm run dev

# Terminal 2: Course Service  
cd course-service
npm run dev

# Terminal 3: Schedule Service (chưa hoàn thành)
cd schedule-service
npm run dev

# Terminal 4: Enrollment Service (chưa hoàn thành) 
cd enrollment-service
npm run dev

# Terminal 5: API Gateway (chưa hoàn thành)
cd api-gateway
npm run dev
```

## API Endpoints

### User Service (Port 3001)

#### Authentication
- **POST** `/api/users/register` - Đăng ký người dùng mới
- **POST** `/api/users/login` - Đăng nhập
- **POST** `/api/users/logout` - Đăng xuất

#### Profile Management
- **GET** `/api/users/profile` - Lấy thông tin profile
- **PUT** `/api/users/profile` - Cập nhật profile
- **PUT** `/api/users/change-password` - Đổi mật khẩu

#### Admin Operations
- **GET** `/api/users` - Lấy danh sách người dùng (Admin)
- **GET** `/api/users/stats` - Thống kê người dùng (Admin)
- **GET** `/api/users/:id` - Lấy thông tin người dùng theo ID
- **PUT** `/api/users/:id/activate` - Kích hoạt tài khoản (Admin)
- **PUT** `/api/users/:id/deactivate` - Vô hiệu hóa tài khoản (Admin)

### Course Service (Port 3002)

#### Public Endpoints
- **GET** `/api/courses` - Lấy danh sách khóa học
- **GET** `/api/courses/:id` - Lấy thông tin khóa học theo ID
- **GET** `/api/courses/available` - Lấy khóa học có sẵn
- **GET** `/api/courses/stats` - Thống kê khóa học

#### Protected Endpoints (Teacher/Admin)
- **POST** `/api/courses` - Tạo khóa học mới
- **PUT** `/api/courses/:id` - Cập nhật khóa học
- **DELETE** `/api/courses/:id` - Xóa khóa học
- **GET** `/api/courses/my/courses` - Lấy khóa học của giảng viên

## Cấu trúc Data Models

### User Model
```javascript
{
  username: String,
  email: String,
  password: String,
  role: "student" | "teacher" | "admin",
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    phone: String,
    address: Object
  },
  studentInfo: {
    studentId: String,
    grade: String,
    major: String
  },
  teacherInfo: {
    teacherId: String,
    department: String,
    subjects: [String]
  }
}
```

### Course Model
```javascript
{
  courseCode: String,
  title: String,
  description: String,
  department: String,
  credits: Number,
  level: "beginner" | "intermediate" | "advanced",
  instructor: {
    teacherId: String,
    name: String,
    email: String
  },
  capacity: {
    max: Number,
    enrolled: Number,
    waitlist: Number
  },
  schedule: {
    semester: "spring" | "summer" | "fall" | "winter",
    year: Number,
    timeSlots: [Object]
  },
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled"
}
```

## Ví dụ sử dụng API

### 1. Đăng ký tài khoản học sinh

```bash
curl -X POST http://localhost:3001/api/users/register \
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

### 2. Đăng nhập

```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student01@example.com",
    "password": "Password123"
  }'
```

### 3. Tạo khóa học (với token của giảng viên)

```bash
curl -X POST http://localhost:3002/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "courseCode": "MATH101",
    "title": "Toán Cơ Bản",
    "description": "Khóa học toán học cơ bản cho sinh viên năm nhất",
    "department": "Toán học",
    "credits": 3,
    "level": "beginner",
    "capacity": {
      "max": 50
    },
    "schedule": {
      "semester": "fall",
      "year": 2025,
      "timeSlots": [{
        "day": "monday",
        "startTime": "09:00",
        "endTime": "10:30",
        "room": "A101",
        "building": "Tòa A"
      }]
    }
  }'
```

### 4. Lấy danh sách khóa học

```bash
curl http://localhost:3002/api/courses?page=1&limit=10&department=Toán%20học
```

## Monitoring và Health Checks

Mỗi service có endpoint health check:
- User Service: http://localhost:3001/health
- Course Service: http://localhost:3002/health

## Logs

Logs được lưu trong thư mục `logs/` của mỗi service:
- `error.log` - Chỉ lỗi
- `combined.log` - Tất cả logs

## Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra MongoDB đang chạy
docker ps | grep mongo

# Kiểm tra logs MongoDB
docker-compose logs mongodb
```

### Lỗi authentication giữa services
- Đảm bảo User Service đang chạy trước Course Service
- Kiểm tra biến môi trường USER_SERVICE_URL

### Port đã được sử dụng
```bash
# Kiểm tra port đang được sử dụng
netstat -an | findstr :3001

# Dừng tất cả containers
docker-compose down
```

## Phát triển tiếp

Hệ thống hiện tại chỉ hoàn thành User Service và Course Service. Các service còn lại cần được phát triển:

1. **Schedule Service** - Quản lý lịch học, thời khóa biểu
2. **Enrollment Service** - Quản lý đăng ký khóa học
3. **API Gateway** - Gateway tổng hợp tất cả services

Mỗi service cần được tích hợp với:
- JWT Authentication thông qua User Service
- Health checks và monitoring
- Logging và error handling
- API documentation với Swagger
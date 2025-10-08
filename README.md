# Hệ thống Microservice Quản lý Học sinh

## Tổng quan
Hệ thống microservice quản lý học sinh, lịch học và khóa học được xây dựng với kiến trúc phân tán, mỗi service độc lập và có thể scale riêng biệt.

## Kiến trúc hệ thống

### Services
1. **User Service** (Port: 3001)
   - Quản lý thông tin học sinh và giáo viên
   - Xác thực và phân quyền (JWT)
   - Database: MongoDB

2. **Course Service** (Port: 3002)
   - Quản lý thông tin khóa học, môn học
   - Quản lý giáo trình và tài liệu
   - Database: MongoDB

3. **Schedule Service** (Port: 3003)
   - Quản lý lịch học, thời khóa biểu
   - Xử lý xung đột lịch học
   - Database: MongoDB

4. **Enrollment Service** (Port: 3004)
   - Quản lý việc đăng ký khóa học
   - Theo dõi tiến độ học tập
   - Database: MongoDB

5. **API Gateway** (Port: 3000)
   - Route requests đến các service phù hợp
   - Load balancing
   - Authentication & Authorization

### Công nghệ sử dụng
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Message Queue**: Redis (cho communication giữa services)
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI

### Luồng dữ liệu chính
1. Client gửi request đến API Gateway
2. API Gateway xác thực và route request đến service tương ứng
3. Service xử lý logic business và tương tác với database
4. Kết quả được trả về thông qua API Gateway

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18+
- MongoDB 6.0+
- Docker & Docker Compose
- npm hoặc yarn

### Khởi chạy hệ thống
```bash
# Clone repository
git clone <repository-url>
cd microservice_be

# Cài đặt dependencies cho tất cả services
npm run install-all

# Build và chạy tất cả services với Docker
docker-compose up --build

# Hoặc chạy từng service riêng biệt
cd user-service && npm start
cd course-service && npm start
cd schedule-service && npm start
cd enrollment-service && npm start
cd api-gateway && npm start
```

### Endpoints chính
- API Gateway: http://localhost:3000
- User Service: http://localhost:3001
- Course Service: http://localhost:3002
- Schedule Service: http://localhost:3003
- Enrollment Service: http://localhost:3004

## API Documentation
Sau khi khởi chạy, Swagger UI có sẵn tại:
- http://localhost:3000/api-docs (API Gateway)
- http://localhost:300x/api-docs (các service riêng lẻ)

## Cấu trúc dự án
```
microservice_be/
├── user-service/           # Service quản lý người dùng
├── course-service/         # Service quản lý khóa học
├── schedule-service/       # Service quản lý lịch học
├── enrollment-service/     # Service quản lý đăng ký
├── api-gateway/           # API Gateway
├── docker-compose.yml     # Container orchestration
└── README.md             # Documentation
```
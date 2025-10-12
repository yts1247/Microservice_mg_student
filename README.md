# Student Management System - Microservices with TypeScript

## Tổng quan
Hệ thống microservice quản lý học sinh, lịch học và khóa học được xây dựng với **TypeScript**, kiến trúc phân tán, mỗi service độc lập và có thể scale riêng biệt. Hệ thống đã được chuyển đổi hoàn toàn từ JavaScript sang TypeScript để tăng cường type safety và trải nghiệm phát triển.

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
- **Backend**: Node.js, Express.js, **TypeScript**
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Type Safety**: TypeScript với strict mode
- **Development**: ts-node-dev, nodemon
- **Build Tool**: TypeScript compiler (tsc)
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

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

### Endpoints chính
- API Gateway: http://localhost:3000
- Admin Frontend: http://localhost:3008 (local mapped port)
 - Admin Frontend: http://localhost:3008 (local mapped port)
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

## Scripts NPM
Mỗi service có các scripts sau:
- `npm run dev` - Development mode với TypeScript hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Chạy production build
- `npm run type-check` - Kiểm tra TypeScript types
- `npm test` - Chạy unit tests
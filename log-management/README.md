# Log Management System

Hệ thống quản lý log cho microservices được xây dựng bằng **Next.js + TypeScript + Ant Design + TailwindCSS**.

## 🎯 Tính năng chính

### ⚡ **Performance & Optimization**
- **Server-side rendering** với Next.js cho tốc độ tải trang
- **Phân trang thông minh** - tải 50 records/trang, giảm tải server
- **File chunking** - xử lý file log lớn theo chunk để tối ưu memory
- **Database indexing** - SQLite với index tối ưu cho query nhanh
- **Lazy loading** - components và data được load khi cần

### 🗂️ **Log Management**
- **Danh sách log theo ngày** - group logs theo service và date
- **Filter theo module** - api-gateway, user-service, course-service, etc.
- **Download logs** - export individual hoặc bulk download
- **View profile** - xem chi tiết log entries với syntax highlighting
- **Auto-scan** - tự động scan và import logs mới từ file system

### 🤖 **Automated Cleanup**
- **Cronjob tự động** - chạy hàng ngày để clean logs cũ
- **Configurable retention** - default 7 ngày, có thể điều chỉnh
- **Archive option** - nén và lưu trữ thay vì xóa hoàn toàn
- **Manual cleanup** - trigger manual qua admin panel

### 👤 **User Management**  
- **Authentication** - JWT-based login system
- **Role-based access** - Admin và Viewer roles
- **Profile management** - modal hiển thị và edit profile
- **Default account** - admin/admin123 để start

### 📊 **Dashboard & Analytics**
- **Service overview** - thống kê tổng quan các services
- **Error tracking** - đếm và highlight errors/warnings
- **File size monitoring** - track disk usage
- **Real-time stats** - refresh data theo realtime

## 🏗️ **Kiến trúc hệ thống**

```
log-management/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── logs/         # Log APIs  
│   │   │   └── dashboard/    # Dashboard data
│   │   ├── dashboard/        # Dashboard page
│   │   ├── login/           # Login page
│   │   └── logs/            # Log management pages
│   ├── components/          # React components
│   │   ├── AppLayout.tsx   # Main layout
│   │   └── ProfileModal.tsx # User profile modal
│   ├── lib/                # Core services
│   │   ├── database.ts     # SQLite database manager
│   │   ├── logScanner.ts   # File scanning service
│   │   ├── cronjob.ts      # Cleanup scheduler
│   │   └── auth.ts         # Authentication utilities
│   └── types/              # TypeScript definitions
└── scripts/                # Setup scripts
```

## 🚀 **Cài đặt và chạy**

### 1. **Quick Start**
```bash
cd log-management
npm install
npm run init        # Initialize database and directories
npm run dev         # Start development server
```

### 2. **Production Setup**
```bash
npm run build       # Build for production
npm start          # Start production server
npm run cronjob:setup  # Setup automated cleanup
```

### 3. **Access URLs**
- **Application**: http://localhost:3007
- **Login**: admin / admin123
- **API**: http://localhost:3007/api

## 📋 **Sử dụng hệ thống**

### **Dashboard**
- Xem tổng quan tất cả services
- Thống kê errors, warnings, info counts
- Recent files và service health status

### **Log Files Management**
- **Filter theo service**: Chọn specific microservice
- **Filter theo ngày**: Date range picker
- **Search**: Tìm kiếm trong log messages
- **View**: Click để xem chi tiết log entries
- **Download**: Export logs thành file text

### **Profile Management**  
- Click avatar → Profile để xem/edit thông tin user
- Change password, email, username
- View account statistics

### **Settings (Admin only)**
- Configure cronjob schedule
- Set retention days (default 7 days)
- Manual cleanup trigger
- System health monitoring

## 🔧 **Configuration**

### **Environment Variables**
```env
DATABASE_URL=./data/logs.db
JWT_SECRET=your-secret-key-here
LOG_RETENTION_DAYS=7
PAGINATION_SIZE=50
ARCHIVE_OLD_LOGS=true
```

### **Cronjob Settings**
- **Schedule**: Cron expression (default: "0 2 * * *" - daily 2 AM)
- **Retention**: Number of days to keep logs (default: 7)
- **Archive**: Compress old logs instead of delete

### **Service Paths** (in logScanner.ts)
```typescript
private logPaths = {
  'api-gateway': '../api-gateway/logs',
  'user-service': '../user-service/logs', 
  'course-service': '../course-service/logs',
  'schedule-service': '../schedule-service/logs',
  'enrollment-service': '../enrollment-service/logs',
}
```

## 📊 **Database Schema**

### **Core Tables**
- `users` - User accounts và authentication
- `log_files` - File metadata và statistics  
- `log_entries` - Individual log messages (indexed)
- `cronjob_config` - Cleanup configuration

### **Indexes cho Performance**
- Service name, date range, log level
- Full-text search trên messages
- File path và timestamps

## 🛠️ **API Endpoints**

### **Authentication**
```bash
POST /api/auth/login     # User login
PUT  /api/auth/profile   # Update profile
```

### **Logs**
```bash
GET /api/logs/files                    # List log files (paginated)
GET /api/logs/files/:id/entries        # Get entries for specific file
GET /api/logs/files/:id/download       # Download log file
POST /api/logs/scan                    # Manual scan trigger
```

### **Dashboard**
```bash
GET /api/dashboard        # Dashboard statistics
GET /api/dashboard/services   # Service overview
```

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Database locked**: Restart application, check file permissions
2. **Logs not showing**: Verify file paths in logScanner.ts
3. **Memory issues**: Reduce PAGINATION_SIZE, enable log archiving
4. **Permission errors**: Check file/directory permissions

### **Performance Tuning**
- Adjust `PAGINATION_SIZE` based on server capacity
- Enable log archiving để save disk space  
- Configure retention period phù hợp với needs
- Monitor database size và optimize indexes

## 📈 **Monitoring & Maintenance**

### **Health Checks**
- Database connection status
- Disk space usage
- Error rates per service
- Cleanup job status

### **Maintenance Tasks**
- Database optimization (VACUUM)
- Archive old logs monthly
- Monitor error patterns
- Update retention policies

Hệ thống được thiết kế để **scale** và **maintain** dễ dàng với minimal overhead. Tất cả operations được optimize cho performance và user experience.

## 🎯 **Key Features Highlights**

✅ **Server-side optimized** - Fast loading với SSR  
✅ **Auto-pagination** - 50 items/page, intelligent chunking  
✅ **Smart file handling** - Chunked processing for large files  
✅ **7-day auto cleanup** - Configurable cronjob automation  
✅ **Modern UI** - Ant Design + TailwindCSS responsive design  
✅ **Profile management** - Modal-based user profile system  
✅ **Role-based security** - Admin/Viewer access control  
✅ **Download functionality** - Export logs với multiple formats
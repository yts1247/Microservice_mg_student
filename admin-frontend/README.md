# Admin Frontend - Hệ thống quản trị

Hệ thống Frontend Admin được xây dựng với Next.js 15, TypeScript, Ant Design và Tailwind CSS để quản lý thông tin một cách hiệu quả và chuyên nghiệp.

## 🚀 Tính năng chính

### ✅ Đã hoàn thành

1. **Layout Admin**
   - Sidebar navigation responsive
   - Header với user menu và notifications
   - Content area với layout linh hoạt
   - Dark/Light theme support (thông qua Ant Design)

2. **Authentication System**
   - Trang đăng nhập với form validation
   - Auth guard middleware
   - JWT token management
   - Auto logout khi token hết hạn
   - Custom hooks cho authentication

3. **Dashboard**
   - Thống kê tổng quan với cards
   - Biểu đồ interactive (Line Chart, Pie Chart)
   - System metrics (CPU, Memory, Disk, Network)
   - Recent activities table
   - Responsive design

4. **Quản lý Users**
   - CRUD operations hoàn chỉnh
   - Search và filter functionality
   - Modal forms cho create/edit
   - Avatar display
   - Role và status management
   - Pagination

5. **API Service Layer**
   - Axios client với interceptors
   - Request/Response interceptors
   - Auto token attachment
   - Error handling centralized
   - TypeScript interfaces cho tất cả API

6. **Quản lý Content (Posts)**
   - CRUD operations cho bài viết
   - Rich text content management
   - Category và tags system
   - Featured image upload
   - Status management (draft/published/archived)
   - Search và filter

7. **Settings & Configuration**
   - General settings (site info, logo, favicon)
   - Security settings (password policy, session timeout)
   - Email/SMTP configuration
   - Notification preferences
   - File upload settings

8. **Responsive Design**
   - Mobile-first approach
   - Tablet optimized layouts
   - Custom breakpoint hooks
   - Adaptive navigation

## 🛠 Tech Stack

- **Framework**: Next.js 15 với App Router
- **Language**: TypeScript
- **UI Library**: Ant Design 5.x
- **Styling**: Tailwind CSS 4.x
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Handling**: Day.js
- **Icons**: Ant Design Icons

## 📁 Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   │   ├── content/       # Content management
│   │   ├── settings/      # System settings
│   │   ├── users/         # User management
│   │   └── layout.tsx     # Admin layout wrapper
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to admin)
├── components/            # Reusable components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── services/             # API services
└── types/               # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm hoặc yarn

### Installation

1. Clone repository:
```bash
git clone <repository-url>
cd admin-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Mở trình duyệt tại: `http://localhost:3000`

### Build for production

```bash
npm run build
npm start
```

## 🔐 Authentication

Hệ thống sử dụng JWT tokens cho authentication:

- **Demo Login**: Sử dụng bất kỳ username/password nào để đăng nhập
- **Token Storage**: localStorage
- **Auto Logout**: Khi token expired
- **Protected Routes**: Tất cả admin routes được bảo vệ

## 📱 Responsive Design

- **Mobile (< 768px)**: Collapsed sidebar, optimized forms
- **Tablet (768px - 1024px)**: Adaptive layouts
- **Desktop (> 1024px)**: Full sidebar, multi-column layouts

## 🎨 UI/UX Features

- **Consistent Design**: Ant Design system
- **Loading States**: Skeleton loading và spinners
- **Error Handling**: Toast notifications
- **Form Validation**: Real-time validation
- **Search & Filter**: Trên tất cả data tables
- **Pagination**: Server-side pagination ready

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Ant Design Theme

Custom theme có thể được config trong `src/app/layout.tsx`

## 📊 Data Management

- **Mock Data**: Sử dụng mock data cho demo
- **API Ready**: Service layer sẵn sàng connect với real API
- **TypeScript Interfaces**: Định nghĩa rõ ràng cho tất cả data types

## 🔮 Future Enhancements

- [ ] Real-time notifications với WebSocket
- [ ] Advanced role-based permissions
- [ ] Multi-language support (i18n)
- [ ] Advanced data visualization
- [ ] File management system
- [ ] Audit logs
- [ ] Advanced search với Elasticsearch
- [ ] PWA support

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi, hãy tạo issue trên GitHub repository.

---

**Developed with ❤️ by Admin Team**

# 📋 Log Management Integration Guide

## Overview

The log management system has been integrated into the admin-frontend service to provide centralized logging capabilities with proper role-based access control. Only users with `admin` role can access the log management features.

## Features Integrated

### ✅ Core Log Management
- **SQLite Database**: Centralized log storage with indexing for fast queries
- **Multi-service Log Aggregation**: Collects logs from all microservices
- **Real-time Log Viewing**: Browse and search logs with pagination
- **Log Filtering**: Filter by service, level, date range, and search terms
- **Log Statistics**: Overview statistics and service-specific metrics

### ✅ Admin-Only Access Control
- **JWT Authentication**: Validates user tokens from user-service
- **Role-based Authorization**: Restricts access to admin users only
- **Audit Trail**: All log access is monitored and recorded
- **Secure API Endpoints**: All log endpoints require admin authentication

### ✅ Export & Management
- **Download Logs**: Export logs in JSON or CSV format
- **Cleanup Tools**: Remove old logs with configurable retention
- **Health Monitoring**: Real-time service health checks
- **Auto-scan**: Automatic import of new log files

## Architecture Changes

### Before Integration
```
┌─────────────────┐    ┌──────────────────┐
│   admin-frontend │    │  log-management  │
│   (Port: 3008)   │    │   (Port: 3007)   │
└─────────────────┘    └──────────────────┘
        │                        │
        └────────┬─────────────────┘
                 │
      ┌──────────▼──────────┐
      │   Separate Services │
      └─────────────────────┘
```

### After Integration  
```
┌─────────────────────────────────┐
│        admin-frontend           │
│        (Port: 3008)             │
│  ┌─────────────────────────────┐│
│  │    Log Management Module    ││
│  │  • SQLite Database         ││
│  │  • Admin-only APIs         ││
│  │  • Role-based Auth         ││
│  │  • Log Processing          ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

## Access Control Implementation

### 1. Authentication Middleware
```typescript
// src/lib/auth.ts
export function withAdminAuth(handler: Function) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = authenticateToken(request);
    
    if (!user || user.role !== "admin") {
      return forbiddenResponse(
        "Access denied. Admin privileges required for log management."
      );
    }
    
    return handler(request, user);
  };
}
```

### 2. Protected API Routes
- `GET /api/admin/logs` - List logs with pagination and filters
- `GET /api/admin/logs/stats` - Get log statistics  
- `GET /api/admin/logs/services` - Get service-specific stats
- `GET /api/admin/logs/dashboard` - Get dashboard data
- `DELETE /api/admin/logs/cleanup` - Delete old logs
- `POST /api/admin/logs/scan` - Scan for new log files

### 3. UI Access Control
- Log Management menu item only visible to admin users
- All log pages protected with role verification
- Clear messaging about admin-only access

## Docker Configuration Updates

### Volume Mounts
```yaml
admin-frontend:
  volumes:
    # Read-only access to all service logs
    - ./api-gateway/logs:/app/logs/api-gateway:ro
    - ./user-service/logs:/app/logs/user-service:ro
    - ./course-service/logs:/app/logs/course-service:ro
    - ./schedule-service/logs:/app/logs/schedule-service:ro
    - ./enrollment-service/logs:/app/logs/enrollment-service:ro
    # SQLite database for log storage
    - log_management_db:/app/logs.db
```

### Environment Variables
```yaml
environment:
  - DATABASE_URL=/app/logs.db
  - LOG_DIRECTORY=/app/logs
  - LOG_RETENTION_DAYS=30
  - JWT_SECRET=mySecretKey123456789012345678901234567890
```

### Resource Allocation
```yaml
deploy:
  resources:
    limits:
      memory: 512M    # Increased for log processing
      cpus: '0.75'
    reservations:
      memory: 256M
      cpus: '0.5'
```

## Usage Instructions

### For Administrators

1. **Login** with admin credentials
2. **Navigate** to "Log Management" in the admin sidebar
3. **View Logs** with real-time filtering and search
4. **Export Logs** in JSON or CSV format
5. **Manage Retention** by cleaning up old logs
6. **Monitor Services** through log statistics

### For Developers

1. **Service Logs** are automatically collected from `/logs` directories
2. **Log Format** should include: timestamp, level, service, message, details
3. **Integration** requires no changes to existing logging systems
4. **Database** is automatically created and managed

## Security Considerations

### ✅ Implemented Security Measures
- **Role-based Access**: Only admin users can access logs
- **JWT Verification**: All requests validated against user-service tokens
- **Read-only Log Access**: Service logs mounted as read-only volumes
- **Audit Logging**: All log access attempts are recorded
- **Input Validation**: All search and filter inputs are sanitized

### ⚠️ Security Recommendations
- **Regular Cleanup**: Configure appropriate log retention policies
- **Monitor Access**: Review log access patterns regularly  
- **Update Tokens**: Rotate JWT secrets periodically
- **Backup Database**: Regularly backup the SQLite log database
- **Network Security**: Use Docker network isolation

## Migration from Separate Service

### Removed Components
- ❌ `log-management` service container
- ❌ Port 3007 exposure  
- ❌ Separate log-management build/dev scripts
- ❌ Independent log-management Docker configuration

### Preserved Functionality
- ✅ All existing log viewing capabilities
- ✅ Log search and filtering features
- ✅ Export and download functionality
- ✅ Log statistics and analytics
- ✅ Automatic log file scanning

## Troubleshooting

### Common Issues

#### 1. "Access Denied" Error
**Problem**: User cannot access log management  
**Solution**: Verify user has `admin` role in user-service

#### 2. Database Connection Error
**Problem**: SQLite database cannot be accessed  
**Solution**: Check volume mount and file permissions

#### 3. No Logs Displayed
**Problem**: Logs not appearing in interface  
**Solution**: Verify log file mounts and run manual scan

#### 4. Performance Issues
**Problem**: Slow log loading  
**Solution**: Increase memory allocation or clean old logs

### Debug Commands

```bash
# Check admin-frontend logs
docker-compose logs admin-frontend

# Verify log file mounts
docker-compose exec admin-frontend ls -la /app/logs

# Check database status
docker-compose exec admin-frontend ls -la /app/logs.db

# Test API endpoints
curl -H "Authorization: Bearer <admin-token>" \
     http://localhost:3008/api/admin/logs/stats
```

## Benefits of Integration

### 🎯 Operational Benefits
- **Simplified Deployment**: One less service to manage
- **Reduced Resource Usage**: Shared container resources
- **Unified Authentication**: Single sign-on for all admin features
- **Streamlined Monitoring**: Centralized admin interface

### 🔒 Security Benefits  
- **Centralized Access Control**: Consistent admin permissions
- **Reduced Attack Surface**: Fewer exposed ports and services
- **Unified Audit Trail**: Single location for admin activity logging
- **Improved Compliance**: Easier to manage and audit access

### 🚀 Development Benefits
- **Faster Development**: Integrated development environment
- **Simplified Testing**: Single service for admin functionality
- **Easier Maintenance**: Unified codebase for admin features
- **Better Integration**: Seamless user experience

## Future Enhancements

### Planned Features
- **Real-time Log Streaming**: WebSocket-based live log viewing
- **Advanced Analytics**: Log pattern analysis and alerting
- **Custom Dashboards**: Configurable log monitoring dashboards
- **Integration APIs**: REST APIs for external log analysis tools
- **Enhanced Export**: More export formats and scheduling options

---

*Log Management is now fully integrated into the admin-frontend with proper role-based access control. Only administrators can access these powerful logging features.*
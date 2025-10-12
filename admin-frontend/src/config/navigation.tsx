import React from "react";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  BellOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  MenuItem,
  PermissionResource,
  PermissionAction,
} from "../types/rbac.types";

/**
 * Navigation Configuration with RBAC
 * Defines menu structure with permission requirements
 */
export const navigationConfig: MenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <DashboardOutlined />,
    path: "/admin",
    permissions: {
      resource: PermissionResource.DASHBOARD,
      action: PermissionAction.READ,
    },
  },
  {
    key: "users",
    label: "User Management",
    icon: <UserOutlined />,
    permissions: {
      resource: PermissionResource.USERS,
      action: PermissionAction.READ,
    },
    children: [
      {
        key: "users-list",
        label: "All Users",
        path: "/admin/users",
        permissions: {
          resource: PermissionResource.USERS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "users-create",
        label: "Add User",
        path: "/admin/users/create",
        permissions: {
          resource: PermissionResource.USERS,
          action: PermissionAction.CREATE,
        },
      },
      {
        key: "users-students",
        label: "Students",
        path: "/admin/users/students",
        permissions: {
          resource: PermissionResource.USERS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "users-instructors",
        label: "Instructors",
        path: "/admin/users/instructors",
        permissions: {
          resource: PermissionResource.USERS,
          action: PermissionAction.READ,
        },
      },
    ],
  },
  {
    key: "courses",
    label: "Course Management",
    icon: <BookOutlined />,
    permissions: {
      resource: PermissionResource.COURSES,
      action: PermissionAction.READ,
    },
    children: [
      {
        key: "courses-list",
        label: "All Courses",
        path: "/admin/courses",
        permissions: {
          resource: PermissionResource.COURSES,
          action: PermissionAction.READ,
        },
      },
      {
        key: "courses-create",
        label: "Add Course",
        path: "/admin/courses/create",
        permissions: {
          resource: PermissionResource.COURSES,
          action: PermissionAction.CREATE,
        },
      },
      {
        key: "courses-categories",
        label: "Categories",
        path: "/admin/courses/categories",
        permissions: {
          resource: PermissionResource.COURSES,
          action: PermissionAction.MANAGE,
        },
      },
    ],
  },
  {
    key: "enrollments",
    label: "Enrollment Management",
    icon: <TeamOutlined />,
    permissions: {
      resource: PermissionResource.ENROLLMENTS,
      action: PermissionAction.READ,
    },
    children: [
      {
        key: "enrollments-list",
        label: "All Enrollments",
        path: "/admin/enrollments",
        permissions: {
          resource: PermissionResource.ENROLLMENTS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "enrollments-pending",
        label: "Pending Enrollments",
        path: "/admin/enrollments/pending",
        permissions: {
          resource: PermissionResource.ENROLLMENTS,
          action: PermissionAction.UPDATE,
        },
      },
      {
        key: "enrollments-bulk",
        label: "Bulk Enrollment",
        path: "/admin/enrollments/bulk",
        permissions: {
          resource: PermissionResource.ENROLLMENTS,
          action: PermissionAction.CREATE,
        },
      },
    ],
  },
  {
    key: "schedules",
    label: "Schedule Management",
    icon: <CalendarOutlined />,
    permissions: {
      resource: PermissionResource.SCHEDULES,
      action: PermissionAction.READ,
    },
    children: [
      {
        key: "schedules-list",
        label: "All Schedules",
        path: "/admin/schedules",
        permissions: {
          resource: PermissionResource.SCHEDULES,
          action: PermissionAction.READ,
        },
      },
      {
        key: "schedules-create",
        label: "Add Schedule",
        path: "/admin/schedules/create",
        permissions: {
          resource: PermissionResource.SCHEDULES,
          action: PermissionAction.CREATE,
        },
      },
      {
        key: "schedules-calendar",
        label: "Calendar View",
        path: "/admin/schedules/calendar",
        permissions: {
          resource: PermissionResource.SCHEDULES,
          action: PermissionAction.READ,
        },
      },
      {
        key: "schedules-rooms",
        label: "Room Management",
        path: "/admin/schedules/rooms",
        permissions: {
          resource: PermissionResource.SCHEDULES,
          action: PermissionAction.MANAGE,
        },
      },
    ],
  },
  {
    key: "analytics",
    label: "Analytics & Reports",
    icon: <BarChartOutlined />,
    permissions: {
      resource: PermissionResource.DASHBOARD,
      action: PermissionAction.READ,
    },
    roles: ["admin", "super admin"],
    children: [
      {
        key: "analytics-overview",
        label: "Overview",
        path: "/admin/analytics/overview",
        permissions: {
          resource: PermissionResource.DASHBOARD,
          action: PermissionAction.READ,
        },
      },
      {
        key: "analytics-users",
        label: "User Analytics",
        path: "/admin/analytics/users",
        permissions: {
          resource: PermissionResource.USERS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "analytics-courses",
        label: "Course Analytics",
        path: "/admin/analytics/courses",
        permissions: {
          resource: PermissionResource.COURSES,
          action: PermissionAction.READ,
        },
      },
      {
        key: "analytics-enrollment",
        label: "Enrollment Reports",
        path: "/admin/analytics/enrollment",
        permissions: {
          resource: PermissionResource.ENROLLMENTS,
          action: PermissionAction.READ,
        },
      },
    ],
  },
  {
    key: "logs",
    label: "System Logs",
    icon: <FileTextOutlined />,
    permissions: {
      resource: PermissionResource.LOGS,
      action: PermissionAction.READ,
    },
    roles: ["admin", "super admin"],
    children: [
      {
        key: "logs-overview",
        label: "Overview",
        path: "/admin/logs",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "logs-user-service",
        label: "User Service",
        path: "/admin/logs/user-service",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "logs-course-service",
        label: "Course Service",
        path: "/admin/logs/course-service",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "logs-schedule-service",
        label: "Schedule Service",
        path: "/admin/logs/schedule-service",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "logs-enrollment-service",
        label: "Enrollment Service",
        path: "/admin/logs/enrollment-service",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
      {
        key: "logs-api-gateway",
        label: "API Gateway",
        path: "/admin/logs/api-gateway",
        permissions: {
          resource: PermissionResource.LOGS,
          action: PermissionAction.READ,
        },
      },
    ],
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: <BellOutlined />,
    path: "/admin/notifications",
    permissions: {
      resource: PermissionResource.SYSTEM,
      action: PermissionAction.READ,
    },
    roles: ["admin", "super admin"],
  },
  {
    key: "system",
    label: "System Management",
    icon: <SettingOutlined />,
    roles: ["admin", "super admin"],
    children: [
      {
        key: "system-settings",
        label: "System Settings",
        path: "/admin/system/settings",
        permissions: {
          resource: PermissionResource.SYSTEM,
          action: PermissionAction.MANAGE,
        },
        roles: ["super admin"],
      },
      {
        key: "system-backup",
        label: "Backup & Restore",
        path: "/admin/system/backup",
        permissions: {
          resource: PermissionResource.SYSTEM,
          action: PermissionAction.MANAGE,
        },
        roles: ["super admin"],
      },
      {
        key: "system-maintenance",
        label: "Maintenance",
        path: "/admin/system/maintenance",
        permissions: {
          resource: PermissionResource.SYSTEM,
          action: PermissionAction.MANAGE,
        },
        roles: ["super admin"],
      },
    ],
  },
  {
    key: "rbac",
    label: "Access Control",
    icon: <SecurityScanOutlined />,
    roles: ["super admin"],
    children: [
      {
        key: "rbac-roles",
        label: "Roles",
        path: "/admin/rbac/roles",
        permissions: {
          resource: PermissionResource.ROLES,
          action: PermissionAction.READ,
        },
        roles: ["super admin"],
      },
      {
        key: "rbac-permissions",
        label: "Permissions",
        path: "/admin/rbac/permissions",
        permissions: {
          resource: PermissionResource.PERMISSIONS,
          action: PermissionAction.READ,
        },
        roles: ["super admin"],
      },
      {
        key: "rbac-assignments",
        label: "Role Assignments",
        path: "/admin/rbac/assignments",
        permissions: {
          resource: PermissionResource.ROLES,
          action: PermissionAction.MANAGE,
        },
        roles: ["super admin"],
      },
    ],
  },
];

/**
 * Get menu items for specific user roles
 */
export const getMenuByRole = (userRole: string): MenuItem[] => {
  switch (userRole.toLowerCase()) {
    case "student":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: <DashboardOutlined />,
          path: "/student/dashboard",
        },
        {
          key: "courses",
          label: "My Courses",
          icon: <BookOutlined />,
          path: "/student/courses",
        },
        {
          key: "schedule",
          label: "My Schedule",
          icon: <CalendarOutlined />,
          path: "/student/schedule",
        },
        {
          key: "enrollments",
          label: "Enrollments",
          icon: <TeamOutlined />,
          path: "/student/enrollments",
        },
      ];

    case "instructor":
      return [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: <DashboardOutlined />,
          path: "/instructor/dashboard",
        },
        {
          key: "courses",
          label: "My Courses",
          icon: <BookOutlined />,
          path: "/instructor/courses",
        },
        {
          key: "schedule",
          label: "Schedule",
          icon: <CalendarOutlined />,
          path: "/instructor/schedule",
        },
        {
          key: "students",
          label: "Students",
          icon: <TeamOutlined />,
          path: "/instructor/students",
        },
      ];

    case "admin":
    case "super admin":
      return navigationConfig;

    default:
      return [];
  }
};

/**
 * Breadcrumb configuration
 */
export const breadcrumbConfig: Record<string, string[]> = {
  "/admin": ["Dashboard"],
  "/admin/users": ["Dashboard", "Users"],
  "/admin/users/create": ["Dashboard", "Users", "Add User"],
  "/admin/users/students": ["Dashboard", "Users", "Students"],
  "/admin/users/instructors": ["Dashboard", "Users", "Instructors"],
  "/admin/courses": ["Dashboard", "Courses"],
  "/admin/courses/create": ["Dashboard", "Courses", "Add Course"],
  "/admin/courses/categories": ["Dashboard", "Courses", "Categories"],
  "/admin/enrollments": ["Dashboard", "Enrollments"],
  "/admin/enrollments/pending": ["Dashboard", "Enrollments", "Pending"],
  "/admin/enrollments/bulk": ["Dashboard", "Enrollment", "Bulk Enrollment"],
  "/admin/schedules": ["Dashboard", "Schedules"],
  "/admin/schedules/create": ["Dashboard", "Schedules", "Add Schedule"],
  "/admin/schedules/calendar": ["Dashboard", "Schedules", "Calendar"],
  "/admin/schedules/rooms": ["Dashboard", "Schedules", "Rooms"],
  "/admin/logs": ["Dashboard", "System Logs", "Overview"],
  "/admin/logs/user-service": ["Dashboard", "System Logs", "User Service"],
  "/admin/logs/course-service": ["Dashboard", "System Logs", "Course Service"],
  "/admin/logs/schedule-service": [
    "Dashboard",
    "System Logs",
    "Schedule Service",
  ],
  "/admin/logs/enrollment-service": [
    "Dashboard",
    "System Logs",
    "Enrollment Service",
  ],
  "/admin/logs/api-gateway": ["Dashboard", "System Logs", "API Gateway"],
  "/admin/rbac/roles": ["Dashboard", "Access Control", "Roles"],
  "/admin/rbac/permissions": ["Dashboard", "Access Control", "Permissions"],
  "/admin/rbac/assignments": ["Dashboard", "Access Control", "Assignments"],
};

export default navigationConfig;

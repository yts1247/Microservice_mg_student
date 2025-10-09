"use client";

import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  BookOutlined,
  HeartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  Layout,
  Menu,
  Button,
  theme,
  Avatar,
  Dropdown,
  Badge,
  Space,
} from "antd";
import type { MenuProps } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useBreakpoint";

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Auto collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  // Menu items
  const menuItems: MenuProps["items"] = [
    {
      key: "/admin",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => router.push("/admin"),
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: "Quản lý người dùng",
      children: [
        {
          key: "/admin/users/list",
          label: "Danh sách",
          onClick: () => router.push("/admin/users"),
        },
        {
          key: "/admin/users/stats",
          label: "Thống kê",
          icon: <BarChartOutlined />,
          onClick: () => router.push("/admin/users/stats"),
        },
      ],
    },
    {
      key: "/admin/courses",
      icon: <BookOutlined />,
      label: "Quản lý khóa học",
      children: [
        {
          key: "/admin/courses/list",
          label: "Danh sách",
          onClick: () => router.push("/admin/courses"),
        },
        {
          key: "/admin/courses/stats",
          label: "Thống kê",
          icon: <BarChartOutlined />,
          onClick: () => router.push("/admin/courses/stats"),
        },
      ],
    },
    {
      key: "/admin/content",
      icon: <FileTextOutlined />,
      label: "Quản lý Content",
      children: [
        {
          key: "/admin/content/posts",
          label: "Bài viết",
          onClick: () => router.push("/admin/content/posts"),
        },
        {
          key: "/admin/content/categories",
          label: "Danh mục",
          onClick: () => router.push("/admin/content/categories"),
        },
      ],
    },
    {
      key: "/admin/health",
      icon: <HeartOutlined />,
      label: "Health Check",
      onClick: () => router.push("/admin/health"),
    },
    {
      key: "/admin/settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => router.push("/admin/settings"),
    },
  ];

  // User dropdown menu
  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
    },
    {
      key: "settings",
      label: "Cài đặt",
      icon: <SettingOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      logout();
    } else if (key === "profile") {
      router.push("/admin/profile");
    } else if (key === "settings") {
      router.push("/admin/settings");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-center h-16 bg-blue-600 text-white font-bold text-lg">
          {collapsed ? "A" : "Admin Panel"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.2s",
        }}
        className="md:ml-0"
      >
        <Header
          style={{
            padding: "0 16px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
          className="sm:px-6"
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <Space size="middle">
            <Badge count={5}>
              <Button type="text" icon={<BellOutlined />} size="large" />
            </Badge>

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=1" />
                <span>
                  {user?.username || user?.profile?.firstName || "Admin User"}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: "16px 8px",
            padding: 16,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "auto",
          }}
          className="sm:m-4 sm:p-6 md:m-6 md:p-8"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;

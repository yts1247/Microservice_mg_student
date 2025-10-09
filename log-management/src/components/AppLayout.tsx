"use client";

import React, { useState, useEffect } from "react";
import {
  ConfigProvider,
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Space,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import ProfileModal from "./ProfileModal";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;
import Image from "next/image";
// import logo from "/public/logo.svg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const router = useRouter();

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/login");
    }

    // Set current path
    setCurrentPath(window.location.pathname);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/logs",
      icon: <FileTextOutlined />,
      label: "Log Files",
    },
    {
      key: "/settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => setProfileVisible(true),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  if (!user) {
    return null; // Loading or redirecting
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#667eea",
          borderRadius: 12,
          colorBgContainer: "rgba(255, 255, 255, 0.95)",
        },
      }}
    >
      <Layout className="min-h-screen animated-bg">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="shadow-2xl"
          width={280}
          style={{
            background:
              "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Modern Logo Section */}
          <div className="h-20 flex items-center justify-center border-b border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                <Image src={"logo"} alt="MG-PRO-LHD" width={32} height={32} />
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-white text-xl font-bold tracking-wide">
                    MG-PRO-LHD
                  </span>
                  <span className="text-purple-300 text-xs font-medium">
                    Log Management
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Menu */}
          <div className="p-4">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[currentPath === "/" ? "/dashboard" : currentPath]}
              items={menuItems.map((item) => ({
                ...item,
                style: {
                  margin: "8px 0",
                  borderRadius: "12px",
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: "500",
                },
              }))}
              onClick={({ key }) => {
                setCurrentPath(key);
                router.push(key);
              }}
              className="border-r-0 bg-transparent"
              style={{ background: "transparent" }}
            />
          </div>

          {/* Collapsed state indicator */}
          {!collapsed && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
              </div>
            </div>
          )}
        </Sider>

        <Layout className="site-layout">
          {/* Modern Header with glassmorphism */}
          <Header
            className="px-6 shadow-lg flex items-center justify-between backdrop-blur-md border-b border-white/20"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              height: "80px",
            }}
          >
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-xl hover:bg-purple-50 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ color: "#667eea" }}
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {currentPath === "/" || currentPath === "/dashboard"
                    ? "Dashboard"
                    : currentPath === "/logs"
                    ? "Log Files"
                    : currentPath === "/settings"
                    ? "Settings"
                    : "Dashboard"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-gray-600">Welcome back,</span>
                <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {user.username}
                </span>
              </div>

              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div className="cursor-pointer group">
                  <Avatar
                    size={44}
                    icon={<UserOutlined />}
                    className="transition-all duration-300 group-hover:scale-110 shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "3px solid rgba(255, 255, 255, 0.8)",
                    }}
                  />
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Enhanced Content Area */}
          <Content
            className="m-6 p-8 rounded-2xl shadow-xl min-h-[calc(100vh-140px)] slide-in-up"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="relative z-10">{children}</div>

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          </Content>
        </Layout>

        <ProfileModal
          open={profileVisible}
          onCancel={() => setProfileVisible(false)}
          user={user}
        />
      </Layout>
    </ConfigProvider>
  );
}

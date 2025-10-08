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
import logo from "/public/logo.svg";

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
          colorPrimary: "#1E40AF",
          borderRadius: 8,
        },
      }}
    >
      <Layout className="min-h-screen bg-slate-50">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="shadow-lg bg-gradient-to-b from-slate-900 to-slate-800"
          width={250}
        >
          <div className="h-16 flex items-center justify-center border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Image src={logo} alt="MG-PRO-LHD" width={36} height={36} />
              {!collapsed && (
                <span className="text-white text-xl font-semibold m-0">
                  MG-PRO-LHD
                </span>
              )}
            </div>
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[currentPath === "/" ? "/dashboard" : currentPath]}
            items={menuItems}
            onClick={({ key }) => {
              setCurrentPath(key);
              router.push(key);
            }}
            className="border-r-0 bg-transparent"
          />
        </Sider>

        <Layout className="site-layout">
          <Header className="bg-white px-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-lg"
              />
              <span className="text-lg font-medium">
                {/* page title can go here */}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-gray-600 hidden sm:block">
                Welcome back, <strong>{user.username}</strong>
              </div>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Avatar
                  icon={<UserOutlined />}
                  className="cursor-pointer bg-blue-600 text-white"
                />
              </Dropdown>
            </div>
          </Header>

          <Content className="m-6 p-6 bg-white rounded-lg shadow-sm min-h-[calc(100vh-140px)]">
            {children}
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

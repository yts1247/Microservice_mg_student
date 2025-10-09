"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, message, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        message.success("Login successful");
        router.push("/dashboard");
      } else {
        message.error(result.error || "Login failed");
      }
    } catch (error) {
      message.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden animated-bg">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-32 right-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl float-animation"></div>
      <div
        className="absolute bottom-20 left-32 w-24 h-24 bg-gradient-to-br from-green-400/25 to-teal-400/25 rounded-full blur-xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-32 right-10 w-16 h-16 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-lg float-animation"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Main Login Card */}
      <Card
        className="w-full max-w-md shadow-2xl border-0 slide-in-up"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "24px",
        }}
      >
        {/* Header Section */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-4">
            <UserOutlined className="text-white text-2xl" />
          </div>

          <Title
            level={2}
            className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-black"
          >
            Log Management System
          </Title>
          <Text className="text-gray-600 font-medium">
            Welcome back! Please sign in to your account
          </Text>

          {/* Decorative line */}
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Enhanced Form */}
        <Form
          name="login"
          initialValues={{
            username: "admin",
            password: "admin123",
          }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          className="space-y-4"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
            className="mb-6"
          >
            <Input
              prefix={
                <div className="p-1 rounded-full bg-purple-100">
                  <UserOutlined className="text-purple-600" />
                </div>
              }
              placeholder="Enter your username"
              className="h-12 rounded-xl border-2 border-purple-100 hover:border-purple-300 focus:border-purple-500 transition-all duration-300"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
            className="mb-8"
          >
            <Input.Password
              prefix={
                <div className="p-1 rounded-full bg-pink-100">
                  <LockOutlined className="text-pink-600" />
                </div>
              }
              placeholder="Enter your password"
              className="h-12 rounded-xl border-2 border-pink-100 hover:border-pink-300 focus:border-pink-500 transition-all duration-300"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 rounded-xl border-0 font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <UserOutlined />
                  Sign In
                </span>
              )}
            </Button>
          </Form.Item>
        </Form>

        {/* Credentials Info */}
        <div
          className="text-center mt-6 p-4 rounded-xl border"
          style={{
            background:
              "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
            border: "1px solid rgba(102, 126, 234, 0.2)",
          }}
        >
          <Text className="text-gray-600 font-medium block mb-2">
            Default Credentials
          </Text>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Username:</span>
              <span className="font-bold text-purple-600 px-2 py-1 rounded-lg bg-purple-100">
                admin
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Password:</span>
              <span className="font-bold text-pink-600 px-2 py-1 rounded-lg bg-pink-100">
                admin123
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          <p>© 2024 MG-PRO-LHD. All rights reserved.</p>
        </div>
      </Card>
    </div>
  );
}

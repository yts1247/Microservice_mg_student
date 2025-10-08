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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            Log Management
          </Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form
          name="login"
          initialValues={{
            username: "admin",
            password: "admin123",
          }}
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Default credentials:</p>
          <p>
            <strong>Username:</strong> admin
          </p>
          <p>
            <strong>Password:</strong> admin123
          </p>
        </div>
      </Card>
    </div>
  );
}

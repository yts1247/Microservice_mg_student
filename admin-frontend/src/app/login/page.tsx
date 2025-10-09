"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Checkbox,
  message,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/useAuthQuery";
import Link from "next/link";

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const loginMutation = useLogin();

  const handleLogin = async (values: LoginForm) => {
    setError(null);

    try {
      await loginMutation.mutateAsync({
        username: values.username,
        password: values.password,
      });

      message.success("Đăng nhập thành công!");
      router.push("/admin");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      message.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2} className="text-gray-900">
            Đăng nhập Admin Panel
          </Title>
          <Text type="secondary">
            Nhập thông tin đăng nhập để truy cập hệ thống quản trị
          </Text>
        </div>

        <Card className="shadow-lg">
          {error && (
            <Alert message={error} type="error" showIcon className="mb-4" />
          )}

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="identifier"
              label="Email hoặc tên đăng nhập"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập email hoặc tên đăng nhập!",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập email hoặc tên đăng nhập"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loginMutation.isPending}
                className="w-full"
              >
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <Text type="secondary">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-800"
              >
                Đăng ký ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

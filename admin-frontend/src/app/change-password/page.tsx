"use client";

import React from "react";
import { Typography, Card, Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useChangePassword } from "@/hooks/useAuthQuery";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const changePasswordMutation = useChangePassword();
  const router = useRouter();

  const handleChangePassword = async (values: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công!");
      form.resetFields();

      // Optionally redirect to profile or login page
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Đổi mật khẩu thất bại!";
      message.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Title level={2} className="text-gray-900">
            Đổi mật khẩu
          </Title>
          <Text type="secondary">
            Nhập mật khẩu cũ và mật khẩu mới để thay đổi
          </Text>
        </div>

        <Card className="shadow-lg">
          <Form
            form={form}
            name="changePassword"
            onFinish={handleChangePassword}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="oldPassword"
              label="Mật khẩu cũ"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu cũ!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu cũ"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu mới"
              />
            </Form.Item>

            <Form.Item className="mt-6">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                size="large"
                loading={changePasswordMutation.isPending}
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

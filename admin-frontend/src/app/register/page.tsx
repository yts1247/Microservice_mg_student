"use client";

import React, { useState } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Alert,
  Row,
  Col,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useRegister } from "@/hooks/useAuthQuery";
import Link from "next/link";

const { Title, Text } = Typography;
const { Option } = Select;

export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<
    "student" | "teacher" | "admin"
  >("student");

  const registerMutation = useRegister();

  const handleRegister = async (values: any) => {
    try {
      const registerData = {
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD"),
          phone: values.phone,
          address: values.address
            ? {
                street: values.street,
                city: values.city,
                state: values.state,
                zipCode: values.zipCode,
                country: values.country,
              }
            : undefined,
        },
        studentInfo:
          values.role === "student"
            ? {
                studentId: values.studentId,
                grade: values.grade,
                major: values.major,
              }
            : undefined,
        teacherInfo:
          values.role === "teacher"
            ? {
                teacherId: values.teacherId,
                department: values.department,
                subjects: values.subjects,
              }
            : undefined,
      };

      await registerMutation.mutateAsync(registerData);
      message.success("Đăng ký tài khoản thành công!");
      router.push("/login");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Đăng ký thất bại!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <Title level={2} className="text-gray-900">
            Đăng ký tài khoản
          </Title>
          <Text type="secondary">Tạo tài khoản mới để truy cập hệ thống</Text>
        </div>

        <Card className="shadow-lg">
          {registerMutation.isError && (
            <Alert
              message={
                (registerMutation.error as any)?.response?.data?.message ||
                "Có lỗi xảy ra"
              }
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          <Form
            form={form}
            name="register"
            onFinish={handleRegister}
            layout="vertical"
            size="large"
            initialValues={{ role: "student" }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="username"
                  label="Tên đăng nhập"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                    {
                      min: 3,
                      message: "Tên đăng nhập phải có ít nhất 3 ký tự!",
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Nhập tên đăng nhập"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Vui lòng nhập email!" },
                    { type: "email", message: "Email không hợp lệ!" },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="Nhập email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập mật khẩu"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Mật khẩu không khớp!")
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Xác nhận mật khẩu"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
            >
              <Select
                onChange={(value) => setSelectedRole(value)}
                placeholder="Chọn vai trò"
              >
                <Option value="student">Học sinh</Option>
                <Option value="teacher">Giáo viên</Option>
                <Option value="admin">Quản trị viên</Option>
              </Select>
            </Form.Item>

            <Title level={5} className="mt-6 mb-4">
              Thông tin cá nhân
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="firstName"
                  label="Họ"
                  rules={[{ required: true, message: "Vui lòng nhập họ!" }]}
                >
                  <Input placeholder="Nhập họ" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="lastName"
                  label="Tên"
                  rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
                >
                  <Input placeholder="Nhập tên" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="dateOfBirth" label="Ngày sinh">
                  <DatePicker className="w-full" placeholder="Chọn ngày sinh" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="phone" label="Số điện thoại">
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Title level={5} className="mt-6 mb-4">
              Địa chỉ (Tùy chọn)
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="street" label="Đường">
                  <Input
                    prefix={<HomeOutlined />}
                    placeholder="Nhập tên đường"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="city" label="Thành phố">
                  <Input placeholder="Nhập thành phố" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="state" label="Tỉnh/Thành">
                  <Input placeholder="Nhập tỉnh/thành" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item name="zipCode" label="Mã bưu điện">
                  <Input placeholder="Nhập mã bưu điện" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item name="country" label="Quốc gia">
                  <Input placeholder="Nhập quốc gia" />
                </Form.Item>
              </Col>
            </Row>

            {selectedRole === "student" && (
              <>
                <Title level={5} className="mt-6 mb-4">
                  Thông tin học sinh
                </Title>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="studentId" label="Mã học sinh">
                      <Input placeholder="Nhập mã học sinh" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item name="grade" label="Lớp">
                      <Input placeholder="Nhập lớp" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item name="major" label="Chuyên ngành">
                      <Input placeholder="Nhập chuyên ngành" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {selectedRole === "teacher" && (
              <>
                <Title level={5} className="mt-6 mb-4">
                  Thông tin giáo viên
                </Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="teacherId" label="Mã giáo viên">
                      <Input placeholder="Nhập mã giáo viên" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item name="department" label="Khoa">
                      <Input placeholder="Nhập khoa" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="subjects" label="Môn dạy">
                  <Select mode="tags" placeholder="Nhập các môn dạy">
                    <Option value="Toán">Toán</Option>
                    <Option value="Lý">Lý</Option>
                    <Option value="Hóa">Hóa</Option>
                    <Option value="Sinh">Sinh</Option>
                    <Option value="Văn">Văn</Option>
                    <Option value="Sử">Sử</Option>
                    <Option value="Địa">Địa</Option>
                    <Option value="Anh">Anh</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            <Form.Item className="mt-6">
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                size="large"
                loading={registerMutation.isPending}
              >
                Đăng ký
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary">
                Đã có tài khoản?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Đăng nhập ngay
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}

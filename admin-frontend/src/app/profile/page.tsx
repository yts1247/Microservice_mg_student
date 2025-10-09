"use client";

import React, { useEffect } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Row,
  Col,
  Spin,
  message,
  Descriptions,
  Tag,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useProfile, useUpdateProfile } from "@/hooks/useAuthQuery";
import dayjs from "dayjs";

const { Title } = Typography;

export default function ProfilePage() {
  const [form] = Form.useForm();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        username: profile.username,
        email: profile.email,
        firstName: profile.profile?.firstName,
        lastName: profile.profile?.lastName,
        dateOfBirth: profile.profile?.dateOfBirth
          ? dayjs(profile.profile.dateOfBirth)
          : null,
        phone: profile.profile?.phone,
        street: profile.profile?.address?.street,
        city: profile.profile?.address?.city,
        state: profile.profile?.address?.state,
        zipCode: profile.profile?.address?.zipCode,
        country: profile.profile?.address?.country,
      });
    }
  }, [profile, form]);

  const handleUpdateProfile = async (values: Record<string, unknown>) => {
    try {
      const updateData = {
        profile: {
          firstName: values.firstName as string,
          lastName: values.lastName as string,
          dateOfBirth: values.dateOfBirth
            ? (values.dateOfBirth as dayjs.Dayjs).format("YYYY-MM-DD")
            : undefined,
          phone: values.phone as string,
          address: {
            street: values.street as string,
            city: values.city as string,
            state: values.state as string,
            zipCode: values.zipCode as string,
            country: values.country as string,
          },
        },
      };

      await updateProfileMutation.mutateAsync(updateData);
      message.success("Cập nhật profile thành công!");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Cập nhật profile thất bại!";
      message.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Không thể tải thông tin profile
          </Title>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Title level={2}>Thông tin cá nhân</Title>

      <Card className="mb-6">
        <Descriptions
          title="Thông tin tài khoản"
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item label="Username">
            {profile?.username}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{profile?.email}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag
              color={
                profile?.role === "admin"
                  ? "red"
                  : profile?.role === "teacher"
                  ? "blue"
                  : "green"
              }
            >
              {profile?.role === "admin"
                ? "Quản trị viên"
                : profile?.role === "teacher"
                ? "Giáo viên"
                : "Học sinh"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {profile?.studentInfo && (
          <Descriptions
            title="Thông tin học sinh"
            bordered
            column={{ xs: 1, sm: 2 }}
            className="mt-4"
          >
            <Descriptions.Item label="Mã học sinh">
              {profile.studentInfo.studentId}
            </Descriptions.Item>
            <Descriptions.Item label="Lớp">
              {profile.studentInfo.grade}
            </Descriptions.Item>
            <Descriptions.Item label="Chuyên ngành">
              {profile.studentInfo.major}
            </Descriptions.Item>
          </Descriptions>
        )}

        {profile?.teacherInfo && (
          <Descriptions
            title="Thông tin giáo viên"
            bordered
            column={{ xs: 1, sm: 2 }}
            className="mt-4"
          >
            <Descriptions.Item label="Mã giáo viên">
              {profile.teacherInfo.teacherId}
            </Descriptions.Item>
            <Descriptions.Item label="Khoa">
              {profile.teacherInfo.department}
            </Descriptions.Item>
            <Descriptions.Item label="Môn dạy" span={2}>
              {profile.teacherInfo.subjects?.map((subject: string) => (
                <Tag key={subject} color="blue">
                  {subject}
                </Tag>
              ))}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Cập nhật thông tin" className="shadow-lg">
        <Form
          form={form}
          name="updateProfile"
          onFinish={handleUpdateProfile}
          layout="vertical"
          size="large"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="username" label="Tên đăng nhập">
                <Input prefix={<UserOutlined />} disabled />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email">
                <Input prefix={<MailOutlined />} disabled />
              </Form.Item>
            </Col>
          </Row>

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

          <Title level={5} className="mt-4 mb-4">
            Địa chỉ
          </Title>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="street" label="Đường">
                <Input prefix={<HomeOutlined />} placeholder="Nhập tên đường" />
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

          <Form.Item className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={updateProfileMutation.isPending}
            >
              Cập nhật thông tin
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

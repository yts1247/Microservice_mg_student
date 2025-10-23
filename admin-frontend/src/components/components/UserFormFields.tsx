"use client";

import React from "react";
import { Form, Input, Select, Row, Col, DatePicker, Divider } from "antd";
import dayjs from "dayjs";

const { Option } = Select;

interface UserFormFieldsProps {
  isEditMode?: boolean;
}

const UserFormFields: React.FC<UserFormFieldsProps> = ({
  isEditMode = false,
}) => {
  return (
    <>
      <Divider orientation="left" style={{ fontWeight: 500 }}>
        Thông tin tài khoản
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập username" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Nhập username" disabled={isEditMode} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        {!isEditMode && (
          <Col span={12}>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              style={{ marginBottom: 12 }}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </Col>
        )}
        <Col span={isEditMode ? 12 : 12}>
          <Form.Item
            label="Vai trò"
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
            style={{ marginBottom: 12 }}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="student">Học sinh</Option>
              <Option value="teacher">Giáo viên</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left" style={{ fontWeight: 500 }}>
        Thông tin cá nhân
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Họ"
            name={["profile", "firstName"]}
            rules={[{ required: true, message: "Vui lòng nhập họ" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Nhập họ" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Tên"
            name={["profile", "lastName"]}
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Nhập tên" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Ngày sinh"
            name={["profile", "dateOfBirth"]}
            style={{ marginBottom: 12 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                current && current > dayjs().endOf("day")
              }
              placeholder="Chọn ngày sinh"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Số điện thoại"
            name={["profile", "phone"]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default UserFormFields;

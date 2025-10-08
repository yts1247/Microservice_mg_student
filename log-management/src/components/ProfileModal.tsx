"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Avatar,
  Descriptions,
  Button,
  message,
} from "antd";
import { UserOutlined, EditOutlined } from "@ant-design/icons";
import { UserProfile } from "@/types";

interface ProfileModalProps {
  open: boolean;
  onCancel: () => void;
  user: UserProfile;
}

export default function ProfileModal({
  open,
  onCancel,
  user,
}: ProfileModalProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleEdit = () => {
    setEditing(true);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        message.success("Profile updated successfully");

        // Update localStorage
        const updatedUser = { ...user, ...values };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        setEditing(false);
        onCancel(); // Close modal and refresh parent
      } else {
        message.error(result.error || "Update failed");
      }
    } catch (error) {
      message.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
    onCancel();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal
      title="User Profile"
      open={open}
      onCancel={handleCancel}
      footer={
        editing
          ? [
              <Button key="cancel" onClick={() => setEditing(false)}>
                Cancel
              </Button>,
              <Button
                key="save"
                type="primary"
                loading={loading}
                onClick={handleSave}
              >
                Save Changes
              </Button>,
            ]
          : [
              <Button
                key="edit"
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>,
              <Button key="close" onClick={onCancel}>
                Close
              </Button>,
            ]
      }
      width={600}
    >
      <div className="text-center mb-6">
        <Avatar
          size={80}
          icon={<UserOutlined />}
          className="bg-primary-500 mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-800">{user.username}</h2>
        <p className="text-gray-600 capitalize">{user.role}</p>
      </div>

      {editing ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user.username,
            email: user.email,
          }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: "Please input your username!" },
              { min: 3, message: "Username must be at least 3 characters!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="New Password (Optional)"
            name="newPassword"
            rules={[
              { min: 6, message: "Password must be at least 6 characters!" },
            ]}
          >
            <Input.Password placeholder="Leave blank to keep current password" />
          </Form.Item>
        </Form>
      ) : (
        <Descriptions bordered column={1}>
          <Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="Username">
            {user.username}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Role">
            <span
              className={`px-2 py-1 rounded text-sm ${
                user.role === "admin"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {user.role}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Member Since">
            {formatDate(user.created_at)}
          </Descriptions.Item>
          {user.last_login && (
            <Descriptions.Item label="Last Login">
              {formatDate(user.last_login)}
            </Descriptions.Item>
          )}
        </Descriptions>
      )}
    </Modal>
  );
}

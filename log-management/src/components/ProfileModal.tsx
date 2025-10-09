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
      title={
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
            <UserOutlined className="text-white text-lg" />
          </div>
          <span className="text-xl font-bold">User Profile</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={
        editing
          ? [
              <Button
                key="cancel"
                onClick={() => setEditing(false)}
                className="rounded-lg h-10 hover:scale-105 transition-all duration-300"
              >
                Cancel
              </Button>,
              <Button
                key="save"
                type="primary"
                loading={loading}
                onClick={handleSave}
                className="rounded-lg h-10 border-0 hover:scale-105 transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>,
            ]
          : [
              <Button
                key="edit"
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
                className="rounded-lg h-10 border-0 hover:scale-105 transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                Edit Profile
              </Button>,
              <Button
                key="close"
                onClick={onCancel}
                className="rounded-lg h-10 hover:scale-105 transition-all duration-300"
              >
                Close
              </Button>,
            ]
      }
      width={650}
      className="profile-modal"
    >
      <div className="text-center mb-8 slide-in-up">
        <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl mb-4 animate-pulse">
          <Avatar
            size={80}
            icon={<UserOutlined />}
            className="bg-white text-purple-600"
            style={{
              border: "4px solid rgba(255, 255, 255, 0.3)",
            }}
          />
        </div>
        <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
          {user.username}
        </h2>
        <div
          className="inline-flex px-4 py-2 rounded-full mt-2"
          style={{
            background:
              user.role === "admin"
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          }}
        >
          <span className="text-white font-bold capitalize text-sm">
            {user.role}
          </span>
        </div>
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

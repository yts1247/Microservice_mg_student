"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Modal, Form, Button, message, Card } from "antd";
import dayjs from "dayjs";
import { UserService, User, CreateUserRequest } from "@/services/userService";
import UserFormFields from "./UserFormFields";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: "create" | "edit";
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSuccess,
  user,
  mode,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (isEditMode && user) {
      form.setFieldsValue({
        ...user,
        profile: {
          ...user.profile,
          dateOfBirth: user.profile?.dateOfBirth
            ? dayjs(user.profile.dateOfBirth)
            : undefined,
        },
      });
    } else {
      form.resetFields();
    }
  }, [user, form, isEditMode, open]);

  const handleFinish = async (values: CreateUserRequest | User) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        profile: {
          ...values.profile,
          dateOfBirth:
            values.profile?.dateOfBirth &&
            typeof values.profile.dateOfBirth !== "string"
              ? (values.profile.dateOfBirth as any).format("YYYY-MM-DD")
              : values.profile?.dateOfBirth,
        },
      };

      if (isEditMode && user) {
        const id = user.id || user._id || "";
        await UserService.updateUser(id, formattedValues);
        message.success("Cập nhật người dùng thành công!");
      } else {
        await UserService.createUser(formattedValues as CreateUserRequest);
        message.success("Tạo người dùng thành công!");
        queryClient.invalidateQueries({ queryKey: ["userStats"] });
      }

      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      const errObj = error as {
        response?: { data?: { errors?: any[]; message?: string } };
      };

      if (errObj?.response?.data?.errors) {
        const fieldErrors = errObj.response.data.errors.map((err) => ({
          name: err.path || err.field,
          errors: [err.msg || err.message],
        }));
        form.setFields(fieldErrors);
      } else {
        message.error(
          errObj?.response?.data?.message ||
            (isEditMode
              ? "Cập nhật người dùng thất bại!"
              : "Tạo người dùng thất bại!")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <span style={{ fontWeight: 600, fontSize: 18 }}>
          {isEditMode ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
        </span>
      }
      onCancel={onClose}
      footer={null}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
      width={700}
    >
      <Card
        bordered={false}
        style={{ borderRadius: 8, boxShadow: "0 2px 8px #f0f1f2" }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          style={{ marginTop: 8 }}
        >
          <UserFormFields isEditMode={isEditMode} />

          <Form.Item style={{ marginTop: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 40, fontWeight: 500 }}
            >
              {isEditMode ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
};

export default UserModal;

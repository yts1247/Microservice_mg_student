"use client";

import React from "react";
import {
  Typography,
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import { useUser, useActivateUser, useDeactivateUser } from "@/hooks/useUsers";

const { Title } = Typography;

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { data: userData, isLoading, error, refetch } = useUser(userId);
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(userId);
      message.success("Kích hoạt người dùng thành công!");
      refetch();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Kích hoạt thất bại!";
      message.error(errorMessage);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(userId);
      message.success("Vô hiệu hóa người dùng thành công!");
      refetch();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Vô hiệu hóa thất bại!";
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

  if (error || !userData?.data) {
    return (
      <div className="p-8">
        <Card>
          <Title level={4} type="danger">
            Không thể tải thông tin người dùng
          </Title>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </Card>
      </div>
    );
  }

  const user = userData.data;

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Quay lại
          </Button>
          <Title level={2} className="mb-0">
            Chi tiết người dùng
          </Title>
        </Space>
        <Space>
          {user.isActive ? (
            <Popconfirm
              title="Vô hiệu hóa người dùng"
              description="Bạn có chắc chắn muốn vô hiệu hóa người dùng này?"
              onConfirm={handleDeactivate}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                danger
                icon={<StopOutlined />}
                loading={deactivateMutation.isPending}
              >
                Vô hiệu hóa
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Kích hoạt người dùng"
              description="Bạn có chắc chắn muốn kích hoạt người dùng này?"
              onConfirm={handleActivate}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={activateMutation.isPending}
              >
                Kích hoạt
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <Card className="mb-6">
        <Descriptions
          title="Thông tin tài khoản"
          bordered
          column={{ xs: 1, sm: 2 }}
        >
          <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
          <Descriptions.Item label="Username">
            {user.username}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag
              color={
                user.role === "admin"
                  ? "red"
                  : user.role === "teacher"
                  ? "blue"
                  : "green"
              }
            >
              {user.role === "admin"
                ? "Quản trị viên"
                : user.role === "teacher"
                ? "Giáo viên"
                : "Học sinh"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={user.isActive ? "success" : "error"}>
              {user.isActive ? "Hoạt động" : "Không hoạt động"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {new Date(user.createdAt).toLocaleString("vi-VN")}
          </Descriptions.Item>
          {user.updatedAt && (
            <Descriptions.Item label="Cập nhật lần cuối">
              {new Date(user.updatedAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card className="mb-6" title="Thông tin cá nhân">
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Họ">
            {user.profile?.firstName}
          </Descriptions.Item>
          <Descriptions.Item label="Tên">
            {user.profile?.lastName}
          </Descriptions.Item>
          {user.profile?.dateOfBirth && (
            <Descriptions.Item label="Ngày sinh">
              {new Date(user.profile.dateOfBirth).toLocaleDateString("vi-VN")}
            </Descriptions.Item>
          )}
          {user.profile?.phone && (
            <Descriptions.Item label="Số điện thoại">
              {user.profile.phone}
            </Descriptions.Item>
          )}
          {user.profile?.address && (
            <>
              {user.profile.address.street && (
                <Descriptions.Item label="Đường">
                  {user.profile.address.street}
                </Descriptions.Item>
              )}
              {user.profile.address.city && (
                <Descriptions.Item label="Thành phố">
                  {user.profile.address.city}
                </Descriptions.Item>
              )}
              {user.profile.address.state && (
                <Descriptions.Item label="Tỉnh/Thành">
                  {user.profile.address.state}
                </Descriptions.Item>
              )}
              {user.profile.address.zipCode && (
                <Descriptions.Item label="Mã bưu điện">
                  {user.profile.address.zipCode}
                </Descriptions.Item>
              )}
              {user.profile.address.country && (
                <Descriptions.Item label="Quốc gia">
                  {user.profile.address.country}
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>
      </Card>

      {user.studentInfo && (
        <Card className="mb-6" title="Thông tin học sinh">
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            {user.studentInfo.studentId && (
              <Descriptions.Item label="Mã học sinh">
                {user.studentInfo.studentId}
              </Descriptions.Item>
            )}
            {user.studentInfo.grade && (
              <Descriptions.Item label="Lớp">
                {user.studentInfo.grade}
              </Descriptions.Item>
            )}
            {user.studentInfo.major && (
              <Descriptions.Item label="Chuyên ngành">
                {user.studentInfo.major}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {user.teacherInfo && (
        <Card className="mb-6" title="Thông tin giáo viên">
          <Descriptions bordered column={{ xs: 1, sm: 2 }}>
            {user.teacherInfo.teacherId && (
              <Descriptions.Item label="Mã giáo viên">
                {user.teacherInfo.teacherId}
              </Descriptions.Item>
            )}
            {user.teacherInfo.department && (
              <Descriptions.Item label="Khoa">
                {user.teacherInfo.department}
              </Descriptions.Item>
            )}
            {user.teacherInfo.subjects &&
              user.teacherInfo.subjects.length > 0 && (
                <Descriptions.Item label="Môn dạy" span={2}>
                  {user.teacherInfo.subjects.map((subject) => (
                    <Tag key={subject} color="blue">
                      {subject}
                    </Tag>
                  ))}
                </Descriptions.Item>
              )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}

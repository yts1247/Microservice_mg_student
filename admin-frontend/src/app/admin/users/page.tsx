"use client";

import React, { useState } from "react";
import { useDebounce } from "use-debounce";
import dynamic from "next/dynamic";
const UserModal = dynamic(
  () => import("../../../components/components/UserModal"),
  {
    ssr: false,
  }
);
import {
  Table,
  Button,
  Space,
  Card,
  Typography,
  Input,
  Select,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import {
  useUsers,
  useUserStats,
  useActivateUser,
  useDeactivateUser,
  useDeleteUser,
} from "@/hooks/useUsers";
import { User } from "@/services/userService";
import { getUserColumns } from "../../../components/components/userTableColumns";
import UserStatsCards from "../../../components/components/UserStatsCards";

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 400);
  const [roleFilter, setRoleFilter] = useState<
    "student" | "teacher" | "admin" | undefined
  >();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users with filters
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useUsers({
    page,
    limit: pageSize,
    search: debouncedSearchText,
    role: roleFilter,
  });

  // Fetch user stats
  const { data: statsData } = useUserStats();

  // Mutations
  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();
  const deleteUserMutation = useDeleteUser();

  const handleActivate = async (id: string) => {
    try {
      await activateMutation.mutateAsync(id);
      message.success("Kích hoạt người dùng thành công!");
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Kích hoạt thất bại!";
      message.error(errorMessage);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMutation.mutateAsync(id);
      message.success("Vô hiệu hóa người dùng thành công!");
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Vô hiệu hóa thất bại!";
      message.error(errorMessage);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    const id = user.id || user._id || "";
    if (!id) {
      message.error("Thiếu ID người dùng");
      return;
    }
    deleteUserMutation.mutate(id, {
      onSuccess: () => {
        message.success({
          content: "Xóa người dùng thành công!",
          type: "success",
        });
      },
      onError: () => {
        message.error("Xóa người dùng thất bại!");
      },
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const columns = getUserColumns({
    handleEdit,
    handleDelete,
    handleActivate,
    handleDeactivate,
    activateMutationPending: activateMutation.isPending,
    deactivateMutationPending: deactivateMutation.isPending,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý người dùng</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Thêm người dùng
          </Button>
        </Space>
      </div>

      {/* User Modal - Combined Create/Edit */}
      <UserModal
        open={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={editingUser}
        mode={modalMode}
      />

      {/* Statistics Cards */}
      <UserStatsCards statsData={statsData} />

      <Card>
        <Space className="mb-4" size="middle">
          <Input
            placeholder="Tìm kiếm theo tên, email, username..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo vai trò"
            style={{ width: 200 }}
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            allowClear
          >
            <Option value="student">Học sinh</Option>
            <Option value="teacher">Giáo viên</Option>
            <Option value="admin">Quản trị viên</Option>
          </Select>
        </Space>

        <Table<User>
          columns={columns}
          dataSource={
            usersData?.data?.users
              ? usersData.data.users.map((u: User) => ({
                  ...u,
                  id: u.id || u._id || "",
                }))
              : []
          }
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: usersData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} người dùng`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default UsersPage;

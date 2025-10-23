import { TableColumnsType } from "antd";
import { User } from "@/services/userService";
import { Tag, Button, Space, Tooltip, Popconfirm } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const getRoleColor = (role: string) => {
  const colors = {
    admin: "red",
    teacher: "blue",
    student: "green",
  };
  return colors[role as keyof typeof colors] || "default";
};

const getRoleText = (role: string) => {
  const texts = {
    admin: "Quản trị viên",
    teacher: "Giáo viên",
    student: "Học sinh",
  };
  return texts[role as keyof typeof texts] || role;
};

interface GetUserColumnsParams {
  handleEdit: (user: User) => void;
  handleDelete: (user: User) => void;
  handleActivate: (id: string) => void;
  handleDeactivate: (id: string) => void;
  activateMutationPending: boolean;
  deactivateMutationPending: boolean;
}

export const getUserColumns = ({
  handleEdit,
  handleDelete,
  handleActivate,
  handleDeactivate,
  activateMutationPending,
  deactivateMutationPending,
}: GetUserColumnsParams): TableColumnsType<User> => [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    sorter: true,
    render: (username: string, record: User) => (
      <Link
        href={`/admin/users/${record.id}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {username}
      </Link>
    ),
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    sorter: true,
  },
  {
    title: "Họ và tên",
    key: "fullName",
    render: (_: unknown, record: User) => (
      <span>
        {record.profile?.firstName} {record.profile?.lastName}
      </span>
    ),
  },
  {
    title: "Vai trò",
    dataIndex: "role",
    key: "role",
    render: (role: string) => (
      <Tag
        color={getRoleColor(role)}
        icon={
          role === "admin" ? (
            <CrownOutlined />
          ) : role === "teacher" ? (
            <TeamOutlined />
          ) : (
            <UserOutlined />
          )
        }
      >
        {getRoleText(role)}
      </Tag>
    ),
    filters: [
      { text: "Quản trị viên", value: "admin" },
      { text: "Giáo viên", value: "teacher" },
      { text: "Học sinh", value: "student" },
    ],
  },
  {
    title: "Trạng thái",
    dataIndex: "isActive",
    key: "isActive",
    render: (isActive: boolean) => (
      <Tag color={isActive ? "success" : "error"}>
        {isActive ? "Hoạt động" : "Không hoạt động"}
      </Tag>
    ),
    filters: [
      { text: "Hoạt động", value: true },
      { text: "Không hoạt động", value: false },
    ],
  },
  {
    title: "Ngày tạo",
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: true,
    render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 260,
    render: (_: unknown, record: User) => (
      <Space size="small">
        <Tooltip title="Xem chi tiết">
          <Link href={`/admin/users/${record.id}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Link>
        </Tooltip>
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Tooltip>
        <Popconfirm
          title="Xóa người dùng"
          description="Bạn có chắc chắn muốn xóa người dùng này?"
          onConfirm={() => handleDelete(record)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <Tooltip title="Xóa vĩnh viễn">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
        {record.isActive ? (
          <Popconfirm
            title="Vô hiệu hóa người dùng"
            description="Bạn có chắc chắn muốn vô hiệu hóa người dùng này?"
            onConfirm={() => handleDeactivate(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Tooltip title="Vô hiệu hóa">
              <Button
                type="text"
                size="small"
                danger
                icon={<StopOutlined />}
                loading={deactivateMutationPending}
              />
            </Tooltip>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="Kích hoạt người dùng"
            description="Bạn có chắc chắn muốn kích hoạt người dùng này?"
            onConfirm={() => handleActivate(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <Tooltip title="Kích hoạt">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={activateMutationPending}
              />
            </Tooltip>
          </Popconfirm>
        )}
      </Space>
    ),
  },
];

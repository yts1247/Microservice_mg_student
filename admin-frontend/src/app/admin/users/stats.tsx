import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

export default function UserStatsPage() {
  return (
    <div>
      <Title level={3}>Thống kê người dùng</Title>
      {/* TODO: Hiển thị thống kê người dùng (sử dụng API /api/users/stats) */}
    </div>
  );
}

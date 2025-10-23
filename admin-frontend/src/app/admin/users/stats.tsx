import React from "react";
import { Typography, Card, Row, Col, Spin, Alert } from "antd";
import { useQuery } from "@tanstack/react-query";

const { Title } = Typography;

// Hàm fetch thống kê người dùng
async function fetchUserStats() {
  const res = await fetch("/api/users/stats");
  if (!res.ok) throw new Error("Không thể lấy thống kê người dùng");
  return res.json();
}

export default function UserStatsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchUserStats,
  });

  return (
    <div>
      <Title level={3}>Thống kê người dùng</Title>
      {isLoading && <Spin />}
      {error && (
        <Alert
          type="error"
          message="Không thể lấy thống kê người dùng"
          showIcon
        />
      )}
      {data && data.success && (
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Card title="Tổng số người dùng" bordered={false}>
              <Title level={2}>{data.data.totalUsers ?? 0}</Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Đang hoạt động" bordered={false}>
              <Title level={2} type="success">
                {data.data.activeUsers ?? 0}
              </Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Ngừng hoạt động" bordered={false}>
              <Title level={2} type="danger">
                {data.data.inactiveUsers ?? 0}
              </Title>
            </Card>
          </Col>
        </Row>
      )}
      {data && !data.success && (
        <Alert
          type="error"
          message={data.message || "Không tìm thấy thống kê người dùng"}
          showIcon
        />
      )}
    </div>
  );
}

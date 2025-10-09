import React from "react";
import { Typography } from "antd";

const { Title } = Typography;

export default function CourseStatsPage() {
  return (
    <div>
      <Title level={3}>Thống kê khóa học</Title>
      {/* TODO: Hiển thị thống kê khóa học (sử dụng API /api/courses/stats) */}
    </div>
  );
}

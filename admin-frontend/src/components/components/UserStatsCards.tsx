import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { UserOutlined, TeamOutlined, CrownOutlined } from "@ant-design/icons";
import { UserStatsResponse } from "@/services/userService";

interface UserStatsCardsProps {
  statsData?: UserStatsResponse;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ statsData }) => {
  if (!statsData?.data) return null;

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tổng người dùng"
            value={statsData.data.totalUsers}
            prefix={<UserOutlined />}
            valueStyle={{ color: "#3f8600" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Học sinh"
            value={statsData.data.totalStudents}
            prefix={<UserOutlined />}
            valueStyle={{ color: "#52c41a" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Giáo viên"
            value={statsData.data.totalTeachers}
            prefix={<TeamOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Quản trị viên"
            value={statsData.data.totalAdmins}
            prefix={<CrownOutlined />}
            valueStyle={{ color: "#cf1322" }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default UserStatsCards;

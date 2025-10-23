"use client";

import React from "react";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function AdminHealthPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Card bordered style={{ minWidth: 350, textAlign: "center" }}>
        <Title level={2} style={{ color: "#52c41a" }}>
          ✅ Admin Frontend Health
        </Title>
        <Paragraph>Admin frontend is running and reachable.</Paragraph>
        <Paragraph type="secondary">
          {`Current time: ${new Date().toLocaleString()}`}
        </Paragraph>
      </Card>
    </div>
  );
}

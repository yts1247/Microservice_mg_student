"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard
    router.push("/admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spin size="large" />
        <p className="mt-4 text-lg">Đang chuyển hướng đến Admin Panel...</p>
      </div>
    </div>
  );
}

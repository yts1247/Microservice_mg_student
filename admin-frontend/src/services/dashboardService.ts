import { ApiService } from "./api";

export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalViews: number;
  totalRevenue: number;
  userGrowth: number;
  postGrowth: number;
  viewGrowth: number;
  revenueGrowth: number;
}

export interface ChartData {
  name: string;
  users: number;
  posts: number;
  views: number;
  revenue: number;
}

export interface RecentActivity {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  status: "success" | "info" | "warning" | "error";
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
}

export interface DeviceStats {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartData[];
  recentActivities: RecentActivity[];
  systemMetrics: SystemMetrics;
  deviceStats: DeviceStats[];
}

export class DashboardService {
  static async getDashboardData(): Promise<DashboardData> {
    return ApiService.get<DashboardData>("/dashboard");
  }

  static async getStats(): Promise<DashboardStats> {
    return ApiService.get<DashboardStats>("/dashboard/stats");
  }

  static async getChartData(period?: string): Promise<ChartData[]> {
    const query = period ? `?period=${period}` : "";
    return ApiService.get<ChartData[]>(`/dashboard/chart-data${query}`);
  }

  static async getRecentActivities(limit?: number): Promise<RecentActivity[]> {
    const query = limit ? `?limit=${limit}` : "";
    return ApiService.get<RecentActivity[]>(`/dashboard/activities${query}`);
  }

  static async getSystemMetrics(): Promise<SystemMetrics> {
    return ApiService.get<SystemMetrics>("/dashboard/system-metrics");
  }

  static async getDeviceStats(): Promise<DeviceStats[]> {
    return ApiService.get<DeviceStats[]>("/dashboard/device-stats");
  }
}

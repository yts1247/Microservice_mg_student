import { ApiService } from "./api";

export interface LogEntry {
  id?: number;
  service: string;
  level: string;
  message: string;
  timestamp: string;
  details?: string;
  source_file?: string;
  created_at?: string;
}

export interface LogStats {
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export interface ServiceStats {
  service: string;
  total: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export interface LogsListResponse {
  success: boolean;
  data: {
    logs: LogEntry[];
    total: number;
    pagination: {
      current: number;
      total: number;
      pages: number;
      limit: number;
    };
  };
}

export interface LogStatsResponse {
  success: boolean;
  data: LogStats;
}

export interface ServiceStatsResponse {
  success: boolean;
  data: ServiceStats[];
}

export interface LogsQueryParams {
  page?: number;
  limit?: number;
  service?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface LogDashboardData {
  stats: LogStats;
  serviceStats: ServiceStats[];
  recentLogs: LogEntry[];
  services: string[];
}

export interface LogDashboardResponse {
  success: boolean;
  data: LogDashboardData;
}

export class LogService {
  // Get logs with pagination and filters
  static async getLogs(params?: LogsQueryParams): Promise<LogsListResponse> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }
    return ApiService.get<LogsListResponse>(`/admin/logs?${query.toString()}`);
  }

  // Get log statistics
  static async getLogStats(
    service?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LogStatsResponse> {
    const query = new URLSearchParams();
    if (service) query.append("service", service);
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);

    return ApiService.get<LogStatsResponse>(`/logs/stats?${query.toString()}`);
  }

  // Get service statistics
  static async getServiceStats(
    startDate?: string,
    endDate?: string
  ): Promise<ServiceStatsResponse> {
    const query = new URLSearchParams();
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);

    return ApiService.get<ServiceStatsResponse>(
      `/logs/services?${query.toString()}`
    );
  }

  // Get dashboard data
  static async getDashboardData(
    startDate?: string,
    endDate?: string
  ): Promise<LogDashboardResponse> {
    const query = new URLSearchParams();
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);

    return ApiService.get<LogDashboardResponse>(
      `/logs/dashboard?${query.toString()}`
    );
  }

  // Get available services
  static async getServices(): Promise<{ success: boolean; data: string[] }> {
    return ApiService.get<{ success: boolean; data: string[] }>(
      "/logs/services/list"
    );
  }

  // Delete old logs
  static async deleteOldLogs(days: number): Promise<{
    success: boolean;
    message: string;
    deleted: number;
  }> {
    return ApiService.delete<{
      success: boolean;
      message: string;
      deleted: number;
    }>(`/logs/cleanup?days=${days}`);
  }

  // Download logs
  static async downloadLogs(params?: {
    service?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
    format?: "json" | "csv";
  }): Promise<Blob> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }

    const response = await fetch(
      `/api/admin/logs/download?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Download failed");
    }

    return response.blob();
  }

  // Scan for new log files
  static async scanLogFiles(): Promise<{
    success: boolean;
    message: string;
    scanned: number;
    imported: number;
  }> {
    return ApiService.post<{
      success: boolean;
      message: string;
      scanned: number;
      imported: number;
    }>("/admin/logs/scan");
  }
}

// Database types
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: "admin" | "viewer";
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LogFile {
  id: number;
  service_name: string;
  file_path: string;
  file_name: string;
  file_size: number;
  created_date: string;
  last_modified: string;
  is_archived: boolean;
}

export interface LogEntry {
  id: number;
  file_id: number;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
  meta?: string; // JSON string
  stack?: string;
  line_number: number;
  raw_content: string;
  created_at: string;
}

// API types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface LogFilters {
  service?: string;
  level?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LogFileWithStats {
  id: number;
  service_name: string;
  file_name: string;
  file_size: number;
  created_date: string;
  last_modified: string;
  is_archived: boolean;
  error_count: number;
  warn_count: number;
  info_count: number;
  total_entries: number;
}

export interface ServiceStats {
  service_name: string;
  total_files: number;
  total_size: number;
  error_count: number;
  warn_count: number;
  info_count: number;
  last_activity: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

// Component props types
export interface LogViewerProps {
  initialData?: PaginatedResponse<LogEntry>;
  serviceFilter?: string;
}

export interface ProfileModalProps {
  open: boolean;
  onCancel: () => void;
  user: UserProfile;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Cronjob types
export interface CronjobConfig {
  enabled: boolean;
  retention_days: number;
  schedule: string; // cron expression
  last_run?: string;
  next_run?: string;
}

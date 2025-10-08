import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
  filter?: Record<string, any>;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  statusCode: number;
  error?: any;
}

export interface DatabaseConfig {
  uri: string;
  options?: Record<string, any>;
}

export interface LoggerConfig {
  level: string;
  format: string;
  transports: any[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

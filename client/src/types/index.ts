// ─── Roles & Statuses ────────────────────────────────────────────────────────

export type Role = 'user' | 'manager' | 'admin';

export type Status =
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'Needs Clarification'
  | 'Closed'
  | 'Reopened';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

// ─── Domain Models ───────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Request {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: Status;
  user_id: number;
  requester_name: string;
  requester_email?: string;
  created_at: string;
  updated_at: string;
  availableTransitions?: Status[];
}

export interface RequestLog {
  id: number;
  request_id: number;
  old_status: Status | null;
  new_status: Status;
  changed_by: number;
  changed_by_name: string;
  role: Role;
  comment: string | null;
  created_at: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRequests {
  requests: Request[];
  pagination: Pagination;
}

export interface Stats {
  Submitted: number;
  Approved: number;
  Rejected: number;
  'Needs Clarification': number;
  Closed: number;
  Reopened: number;
  total: number;
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface LoginForm {
  email: string;
  password: string;
}

export interface CreateRequestForm {
  title: string;
  description: string;
  category: string;
  priority: Priority;
}

export interface UpdateStatusForm {
  status: Status;
  comment?: string;
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface RequestFilters {
  status?: Status | '';
  category?: string;
  priority?: Priority | '';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

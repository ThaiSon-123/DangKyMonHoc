export type Role = "ADMIN" | "STUDENT" | "TEACHER";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string;
  is_locked: boolean;
  is_active: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export type Role = "ADMIN" | "STUDENT" | "TEACHER";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string;
  is_locked: boolean;
  is_active: boolean;
  student_major: number | null;
  teacher_department: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

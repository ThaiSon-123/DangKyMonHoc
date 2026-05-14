import { api } from "./client";
import type { Role, User } from "@/types";
import type { Paginated } from "@/types/domain";

export type UserCreateInput = {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  role: Role; // chỉ STUDENT hoặc TEACHER (backend chặn ADMIN)
  phone?: string;
  student_major?: number | null;
  teacher_department?: string;
};

export type UserUpdateInput = {
  email?: string;
  full_name?: string;
  role?: Role;
  phone?: string;
  is_locked?: boolean;
  is_active?: boolean;
  student_major?: number | null;
  teacher_department?: string;
};

export async function listUsers(params?: {
  search?: string;
  role?: Role;
  is_locked?: boolean;
  department?: string;
  major?: number;
  page?: number;
  page_size?: number;
}): Promise<Paginated<User>> {
  // Convert boolean → string cho query param
  const queryParams: Record<string, string | number> = {};
  if (params?.search) queryParams.search = params.search;
  if (params?.role) queryParams.role = params.role;
  if (params?.is_locked !== undefined) queryParams.is_locked = String(params.is_locked);
  if (params?.department) queryParams.department = params.department;
  if (params?.major) queryParams.major = params.major;
  if (params?.page) queryParams.page = params.page;
  if (params?.page_size) queryParams.page_size = params.page_size;
  const res = await api.get<Paginated<User>>("/accounts/users/", { params: queryParams });
  return res.data;
}

export async function createUser(payload: UserCreateInput): Promise<User> {
  const res = await api.post<User>("/accounts/users/", payload);
  return res.data;
}

export async function updateUser(id: number, payload: UserUpdateInput): Promise<User> {
  const res = await api.patch<User>(`/accounts/users/${id}/`, payload);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/accounts/users/${id}/`);
}

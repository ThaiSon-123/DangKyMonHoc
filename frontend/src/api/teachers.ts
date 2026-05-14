import { api } from "./client";
import type { Paginated, TeacherProfile } from "@/types/domain";

export async function listTeachers(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<TeacherProfile>> {
  const res = await api.get<Paginated<TeacherProfile>>("/teachers/", { params });
  return res.data;
}

export async function getMyTeacherProfile(): Promise<TeacherProfile> {
  const res = await api.get<TeacherProfile>("/teachers/me/");
  return res.data;
}

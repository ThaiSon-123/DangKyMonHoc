import { api } from "./client";
import type { Major, Paginated } from "@/types/domain";

export type MajorInput = Pick<
  Major, "code" | "name" | "department" | "duration_years" | "description" | "is_active"
>;

export async function listMajors(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Major>> {
  const res = await api.get<Paginated<Major>>("/majors/", { params });
  return res.data;
}

export async function createMajor(payload: Partial<MajorInput>): Promise<Major> {
  const res = await api.post<Major>("/majors/", payload);
  return res.data;
}

export async function updateMajor(id: number, payload: Partial<MajorInput>): Promise<Major> {
  const res = await api.patch<Major>(`/majors/${id}/`, payload);
  return res.data;
}

export async function deleteMajor(id: number): Promise<void> {
  await api.delete(`/majors/${id}/`);
}

import { api } from "./client";
import type { Paginated, Semester } from "@/types/domain";

export type SemesterInput = Pick<
  Semester,
  "code" | "name" | "term" | "academic_year" | "start_date" | "end_date" | "registration_start" | "registration_end" | "is_open"
>;

export async function listSemesters(params?: {
  search?: string;
  page?: number;
<<<<<<< HEAD
  page_size?: number;
=======
>>>>>>> 1f46ee961aae46de3dde0ef63ebc43bccbea96d6
}): Promise<Paginated<Semester>> {
  const res = await api.get<Paginated<Semester>>("/semesters/", { params });
  return res.data;
}

export async function createSemester(payload: Partial<SemesterInput>): Promise<Semester> {
  const res = await api.post<Semester>("/semesters/", payload);
  return res.data;
}

export async function updateSemester(id: number, payload: Partial<SemesterInput>): Promise<Semester> {
  const res = await api.patch<Semester>(`/semesters/${id}/`, payload);
  return res.data;
}

export async function deleteSemester(id: number): Promise<void> {
  await api.delete(`/semesters/${id}/`);
}

export async function openSemester(id: number): Promise<Semester> {
  const res = await api.post<Semester>(`/semesters/${id}/open/`);
  return res.data;
}

export async function closeSemester(id: number): Promise<Semester> {
  const res = await api.post<Semester>(`/semesters/${id}/close/`);
  return res.data;
}

import { api } from "./client";
import type { Paginated } from "@/types/domain";

export interface Grade {
  id: number;
  registration: number;
  student_code: string;
  student_name: string;
  course: number;
  course_code: string;
  course_name: string;
  course_credits: number;
  class_section_code: string;
  semester_code: string;
  semester_name: string;
  process_score: string | null;
  midterm_score: string | null;
  final_score: string | null;
  total_score: string | null;
  gpa_4: string | null;
  grade_letter: string;
  note: string;
  updated_at: string;
}

export type GradeInput = {
  registration: number;
  process_score?: string | number | null;
  midterm_score?: string | number | null;
  final_score?: string | number | null;
  note?: string;
};

export async function listGrades(params?: {
  registration?: number;
  class_section?: number;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Grade>> {
  const res = await api.get<Paginated<Grade>>("/grades/", { params });
  return res.data;
}

export async function createGrade(payload: GradeInput): Promise<Grade> {
  const res = await api.post<Grade>("/grades/", payload);
  return res.data;
}

export async function updateGrade(id: number, payload: Partial<GradeInput>): Promise<Grade> {
  const res = await api.patch<Grade>(`/grades/${id}/`, payload);
  return res.data;
}

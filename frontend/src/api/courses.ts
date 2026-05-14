import { api } from "./client";
import type { Course, Paginated } from "@/types/domain";

export type CourseInput = Pick<
  Course,
  "code" | "name" | "credits" | "theory_hours" | "practice_hours" | "description" | "is_active"
> & {
  prerequisite_ids: number[];
};

export async function listCourses(params?: {
  search?: string;
  department?: string;
  major?: number;
  curriculum?: number;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Course>> {
  const res = await api.get<Paginated<Course>>("/courses/", { params });
  return res.data;
}

export async function createCourse(payload: Partial<CourseInput>): Promise<Course> {
  const res = await api.post<Course>("/courses/", payload);
  return res.data;
}

export async function updateCourse(id: number, payload: Partial<CourseInput>): Promise<Course> {
  const res = await api.patch<Course>(`/courses/${id}/`, payload);
  return res.data;
}

export async function deleteCourse(id: number): Promise<void> {
  await api.delete(`/courses/${id}/`);
}

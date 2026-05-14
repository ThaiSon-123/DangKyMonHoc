import { api } from "./client";
import type {
  Curriculum,
  CurriculumCourse,
  KnowledgeBlock,
  Paginated,
} from "@/types/domain";

export type CurriculumInput = Pick<
  Curriculum,
  "code" | "name" | "major" | "cohort_year" | "total_credits_required" | "description" | "is_active"
>;

export type CurriculumCourseInput = {
  curriculum: number;
  course: number;
  knowledge_block: KnowledgeBlock;
  is_required: boolean;
  suggested_semester: number;
};

export async function listCurriculums(params?: {
  search?: string;
  major?: number;
  cohort_year?: number;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Curriculum>> {
  const res = await api.get<Paginated<Curriculum>>("/curriculums/", { params });
  return res.data;
}

export async function getCurriculum(id: number): Promise<Curriculum> {
  const res = await api.get<Curriculum>(`/curriculums/${id}/`);
  return res.data;
}

export async function createCurriculum(payload: Partial<CurriculumInput>): Promise<Curriculum> {
  const res = await api.post<Curriculum>("/curriculums/", payload);
  return res.data;
}

export async function updateCurriculum(
  id: number,
  payload: Partial<CurriculumInput>,
): Promise<Curriculum> {
  const res = await api.patch<Curriculum>(`/curriculums/${id}/`, payload);
  return res.data;
}

export async function deleteCurriculum(id: number): Promise<void> {
  await api.delete(`/curriculums/${id}/`);
}

// ---- CurriculumCourse (môn trong CTĐT) ----

export async function addCourseToCurriculum(
  payload: CurriculumCourseInput,
): Promise<CurriculumCourse> {
  const res = await api.post<CurriculumCourse>("/curriculum-courses/", payload);
  return res.data;
}

export async function updateCurriculumCourse(
  id: number,
  payload: Partial<CurriculumCourseInput>,
): Promise<CurriculumCourse> {
  const res = await api.patch<CurriculumCourse>(`/curriculum-courses/${id}/`, payload);
  return res.data;
}

export async function removeCourseFromCurriculum(id: number): Promise<void> {
  await api.delete(`/curriculum-courses/${id}/`);
}

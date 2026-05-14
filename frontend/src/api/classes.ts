import { api } from "./client";
import type {
  ClassSection,
  ClassStatus,
  Paginated,
  Schedule,
  SessionType,
  Weekday,
} from "@/types/domain";

export type ClassSectionInput = {
  code: string;
  course: number;
  semester: number;
  teacher: number | null;
  periods_per_session: number;
  max_students: number;
  status: ClassStatus;
  note: string;
  primary_schedule?: Omit<ScheduleInput, "class_section">;
};

export async function listClassSections(params?: {
  search?: string;
  course?: number;
  semester?: number;
  teacher?: number;
  department?: string;
  major?: number;
  status?: ClassStatus;
  page?: number;
  page_size?: number;
}): Promise<Paginated<ClassSection>> {
  const res = await api.get<Paginated<ClassSection>>("/class-sections/", { params });
  return res.data;
}

export async function getClassSection(id: number): Promise<ClassSection> {
  const res = await api.get<ClassSection>(`/class-sections/${id}/`);
  return res.data;
}

export async function createClassSection(
  payload: Partial<ClassSectionInput>,
): Promise<ClassSection> {
  const res = await api.post<ClassSection>("/class-sections/", payload);
  return res.data;
}

export async function updateClassSection(
  id: number,
  payload: Partial<ClassSectionInput>,
): Promise<ClassSection> {
  const res = await api.patch<ClassSection>(`/class-sections/${id}/`, payload);
  return res.data;
}

export async function deleteClassSection(id: number): Promise<void> {
  await api.delete(`/class-sections/${id}/`);
}

// ---------- Schedule ----------

export type ScheduleInput = {
  class_section: number;
  weekday: Weekday;
  session: SessionType;
  start_period: number;
  room: string;
  start_date?: string | null;
  end_date?: string | null;
};

export async function createSchedule(payload: ScheduleInput): Promise<Schedule> {
  const res = await api.post<Schedule>("/schedules/", payload);
  return res.data;
}

export async function updateSchedule(
  id: number,
  payload: Partial<ScheduleInput>,
): Promise<Schedule> {
  const res = await api.patch<Schedule>(`/schedules/${id}/`, payload);
  return res.data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await api.delete(`/schedules/${id}/`);
}

// ---------- Notify class ----------

export type NotifyClassInput = {
  title: string;
  body: string;
  category?: "REGISTRATION" | "SCHEDULE" | "CLASS" | "SYSTEM" | "OTHER";
};

export interface NotifyClassResult {
  notification: {
    id: number;
    title: string;
    body: string;
    category: string;
    audience: string;
    created_at: string;
  };
  recipient_count: number;
  class_code: string;
}

export async function notifyClass(
  classSectionId: number,
  payload: NotifyClassInput,
): Promise<NotifyClassResult> {
  const res = await api.post<NotifyClassResult>(
    `/class-sections/${classSectionId}/notify/`,
    payload,
  );
  return res.data;
}

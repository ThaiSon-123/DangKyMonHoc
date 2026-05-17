import { api } from "./client";
import type { ClassSection, Schedule } from "@/types/domain";

export type PriorityPreset =
  | "AUTO"
  | "BALANCED"
  | "TEACHER_FIRST"
  | "SESSION_FIRST"
  | "COMPACT_FIRST";

export const PRESET_LABELS: Record<PriorityPreset, string> = {
  AUTO: "Tự động (theo input của bạn)",
  BALANCED: "Cân bằng",
  TEACHER_FIRST: "Ưu tiên giáo viên",
  SESSION_FIRST: "Ưu tiên ca học",
  COMPACT_FIRST: "Ưu tiên nhiều ngày nghỉ",
};

export const PRESET_DESCRIPTIONS: Record<PriorityPreset, string> = {
  AUTO: "Hệ thống tự chia trọng số dựa trên tiêu chí bạn đã khai báo",
  BALANCED: "4 tiêu chí ngang nhau (25% mỗi)",
  TEACHER_FIRST: "GV chiếm 55%, các yếu tố khác 15%",
  SESSION_FIRST: "Ca học chiếm 55%, các yếu tố khác 15%",
  COMPACT_FIRST: "Số ngày nghỉ chiếm 55%, các yếu tố khác 15%",
};

export type Session = "MORNING" | "AFTERNOON" | "EVENING";

export const SESSION_OPTIONS: Array<{ value: Session; label: string }> = [
  { value: "MORNING", label: "Sáng (tiết 1-5)" },
  { value: "AFTERNOON", label: "Chiều (tiết 6-10)" },
  { value: "EVENING", label: "Tối (tiết 11-15)" },
];

// ──────────────── Available courses ────────────────

export interface AvailableClassSection {
  id: number;
  code: string;
  enrolled_count: number;
  max_students: number;
  schedules: Schedule[];
}

export interface AvailableTeacher {
  teacher_id: number | null;
  teacher_name: string | null;
  class_sections: AvailableClassSection[];
}

export interface AvailableCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  has_grade: boolean;
  passed: boolean;
  missing_prerequisites: string[];
  registered: boolean;
  teachers: AvailableTeacher[];
}

export interface AvailableCoursesResponse {
  count: number;
  results: AvailableCourse[];
}

export async function listAvailableCourses(params: {
  semester: number;
  search?: string;
  unlearned_only?: boolean;
}): Promise<AvailableCoursesResponse> {
  const res = await api.get<AvailableCoursesResponse>(
    "/auto-schedule/available-courses/",
    {
      params: {
        semester: params.semester,
        search: params.search || undefined,
        unlearned_only: params.unlearned_only ? "true" : undefined,
      },
    },
  );
  return res.data;
}

// ──────────────── Suggest ────────────────

export interface AutoScheduleRequest {
  semester: number;
  course_ids: number[];
  avoid_weekdays?: number[];
  preferred_sessions?: Session[];
  preferred_teacher_ids?: number[];
  preset?: PriorityPreset;
  course_teacher_constraints?: Record<string, number>;
  max_results?: number;
}

export interface ScoreBreakdown {
  weekday: number;
  session: number;
  teacher: number;
  free_day: number;
  total: number;
}

export interface CandidateStats {
  study_days: number;
  free_days: number;
}

export interface AutoScheduleCandidate {
  class_sections: ClassSection[];
  score: number;
  breakdown: ScoreBreakdown;
  stats: CandidateStats;
}

export interface AutoScheduleResponse {
  count: number;
  results: AutoScheduleCandidate[];
}

export async function suggestSchedules(
  payload: AutoScheduleRequest,
): Promise<AutoScheduleResponse> {
  const res = await api.post<AutoScheduleResponse>(
    "/auto-schedule/suggest/",
    payload,
  );
  return res.data;
}

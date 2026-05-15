import { api } from "./client";
import type { ClassSection } from "@/types/domain";

export type PriorityPreset =
  | "BALANCED"
  | "TEACHER_FIRST"
  | "SESSION_FIRST"
  | "COMPACT_FIRST";

export const PRESET_LABELS: Record<PriorityPreset, string> = {
  BALANCED: "Cân bằng",
  TEACHER_FIRST: "Ưu tiên giáo viên",
  SESSION_FIRST: "Ưu tiên ca học",
  COMPACT_FIRST: "Ưu tiên TKB gọn",
};

export const PRESET_DESCRIPTIONS: Record<PriorityPreset, string> = {
  BALANCED: "4 tiêu chí ngang nhau (25% mỗi)",
  TEACHER_FIRST: "GV chiếm 55%, các yếu tố khác 15%",
  SESSION_FIRST: "Ca học chiếm 55%, các yếu tố khác 15%",
  COMPACT_FIRST: "Tối thiểu khoảng trống chiếm 55%, các yếu tố khác 15%",
};

export type Session = "MORNING" | "AFTERNOON" | "EVENING";

export const SESSION_OPTIONS: Array<{ value: Session; label: string }> = [
  { value: "MORNING", label: "Sáng (tiết 1-5)" },
  { value: "AFTERNOON", label: "Chiều (tiết 6-10)" },
  { value: "EVENING", label: "Tối (tiết 11-15)" },
];

export interface AutoScheduleRequest {
  semester: number;
  course_ids: number[];
  avoid_weekdays?: number[]; // 0=T2 ... 6=CN
  preferred_sessions?: Session[];
  preferred_teacher_ids?: number[];
  minimize_gaps?: boolean;
  preset?: PriorityPreset;
  /** Per-course hard filter: { [course_id]: teacher_id } */
  course_teacher_constraints?: Record<string, number>;
  max_results?: number;
}

export interface ScoreBreakdown {
  weekday: number;
  session: number;
  teacher: number;
  gap: number;
  total: number;
}

export interface AutoScheduleCandidate {
  class_sections: ClassSection[];
  score: number;
  breakdown: ScoreBreakdown;
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

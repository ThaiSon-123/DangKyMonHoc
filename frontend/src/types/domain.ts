export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Major {
  id: number;
  code: string;
  name: string;
  department: string;
  duration_years: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits: number;
  theory_hours: number;
  practice_hours: number;
  description: string;
  is_active: boolean;
  prerequisites_detail: Array<{
    id: number;
    required_course: number;
    required_course_code: string;
    required_course_name: string;
    note: string;
  }>;
  prerequisite_ids?: number[];
  created_at: string;
  updated_at: string;
}

/** Plan §7.2.9: 1=HK1, 2=HK2, 3=HK3 */
export type SemesterTerm = 1 | 2 | 3;

export interface Semester {
  id: number;
  code: string;
  name: string;
  term: SemesterTerm;
  term_display: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  registration_start: string | null;
  registration_end: string | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: number;
  registration: number;
  process_score: string | null;
  midterm_score: string | null;
  final_score: string | null;
  total_score: string | null;
  gpa_4: string | null;
  grade_letter: string;
  note: string;
  updated_at: string;
}

export type KnowledgeBlock = "GENERAL" | "BASIC" | "MAJOR" | "ELECTIVE" | "THESIS";

export const KNOWLEDGE_BLOCK_LABELS: Record<KnowledgeBlock, string> = {
  GENERAL: "Đại cương",
  BASIC: "Cơ sở ngành",
  MAJOR: "Chuyên ngành",
  ELECTIVE: "Tự chọn",
  THESIS: "Tốt nghiệp",
};

export interface CurriculumCourse {
  id: number;
  curriculum: number;
  course: number;
  course_code: string;
  course_name: string;
  course_credits: number;
  knowledge_block: KnowledgeBlock;
  knowledge_block_display: string;
  is_required: boolean;
  suggested_semester: number;
}

export interface Curriculum {
  id: number;
  code: string;
  name: string;
  major: number;
  major_code: string;
  major_name: string;
  cohort_year: number;
  total_credits_required: number;
  description: string;
  is_active: boolean;
  curriculum_courses: CurriculumCourse[];
  created_at: string;
  updated_at: string;
}

// ---------- Class Section ----------

export type ClassStatus = "DRAFT" | "OPEN" | "CLOSED" | "CANCELLED";

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  DRAFT: "Nháp",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã huỷ",
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Thứ 2",
  1: "Thứ 3",
  2: "Thứ 4",
  3: "Thứ 5",
  4: "Thứ 6",
  5: "Thứ 7",
  6: "Chủ nhật",
};

export type SessionType = "MORNING" | "AFTERNOON" | "EVENING";

export const SESSION_LABELS: Record<SessionType, string> = {
  MORNING: "Sáng (tiết 1-5)",
  AFTERNOON: "Chiều (tiết 6-10)",
  EVENING: "Tối (tiết 11-15)",
};

export const SESSION_PERIODS: Record<SessionType, [number, number]> = {
  MORNING: [1, 5],
  AFTERNOON: [6, 10],
  EVENING: [11, 15],
};

export interface Schedule {
  id: number;
  class_section: number;
  weekday: Weekday;
  weekday_display: string;
  session: SessionType;
  session_display: string;
  start_period: number;
  end_period: number;
  room: string;
  start_date: string | null;
  end_date: string | null;
}

export interface ClassSection {
  id: number;
  code: string;
  course: number;
  course_code: string;
  course_name: string;
  course_credits: number;
  semester: number;
  semester_code: string;
  teacher: number | null;
  teacher_code: string | null;
  teacher_name: string | null;
  periods_per_session: number;
  max_students: number;
  enrolled_count: number;
  is_full: boolean;
  status: ClassStatus;
  status_display: string;
  note: string;
  schedules: Schedule[];
  created_at: string;
  updated_at: string;
}

export interface TeacherProfile {
  id: number;
  user: number;
  username: string;
  full_name: string;
  teacher_code: string;
  department: string;
  title: string;
  is_active: boolean;
}

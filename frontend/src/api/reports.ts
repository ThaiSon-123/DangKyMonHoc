import { api } from "./client";

export interface AdminReportsSummary {
  semester: {
    id: number;
    code: string;
    name: string;
    is_open: boolean;
  } | null;
  users: {
    total: number;
    admin: number;
    student: number;
    teacher: number;
    locked: number;
  };
  classes: {
    total: number;
    draft: number;
    open: number;
    closed: number;
    cancelled: number;
    full: number;
  };
  registrations: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  top_courses: Array<{
    course_code: string;
    course_name: string;
    credits: number;
    registrations: number;
  }>;
  by_major: Array<{
    major_code: string;
    major_name: string;
    registrations: number;
    students: number;
  }>;
  by_semester: Array<{
    semester_id: number;
    semester_code: string;
    semester_name: string;
    registrations: number;
  }>;
  total_majors: number;
}

export async function getAdminReportsSummary(semesterId?: number): Promise<AdminReportsSummary> {
  const res = await api.get<AdminReportsSummary>("/reports/admin-summary/", {
    params: semesterId ? { semester: semesterId } : undefined,
  });
  return res.data;
}

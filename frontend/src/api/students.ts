import { api } from "./client";

export interface StudentProfile {
  id: number;
  user: number;
  username: string;
  full_name: string;
  student_code: string;
  major: number;
  major_code: string;
  major_name: string;
  enrollment_year: number;
  gpa: string;
  completed_credits: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getMyStudentProfile(): Promise<StudentProfile> {
  const res = await api.get<StudentProfile>("/students/me/");
  return res.data;
}

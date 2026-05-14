import { api } from "./client";
import type { Paginated } from "@/types/domain";

export type RegistrationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã đăng ký",
  CANCELLED: "Đã huỷ",
};

export interface Registration {
  id: number;
  student: number;
  student_code: string;
  student_name: string;
  class_section: number;
  class_section_code: string;
  course_code: string;
  course_name: string;
  course_credits: number;
  semester: number;
  semester_code: string;
  status: RegistrationStatus;
  status_display: string;
  registered_at: string;
  cancelled_at: string | null;
  cancel_reason: string;
}

export async function listRegistrations(params?: {
  search?: string;
  semester?: number;
  class_section?: number;
  student?: number;
  status?: RegistrationStatus;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Registration>> {
  const res = await api.get<Paginated<Registration>>("/registrations/", { params });
  return res.data;
}

export async function cancelRegistration(
  id: number,
  cancel_reason: string,
): Promise<Registration> {
  const res = await api.post<Registration>(`/registrations/${id}/cancel/`, { cancel_reason });
  return res.data;
}

export async function deleteRegistration(id: number): Promise<void> {
  await api.delete(`/registrations/${id}/`);
}

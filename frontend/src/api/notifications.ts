import { api } from "./client";
import type { Paginated } from "@/types/domain";

export type NotiCategory = "REGISTRATION" | "SCHEDULE" | "CLASS" | "SYSTEM" | "OTHER";
export type NotiAudience = "ALL_STUDENTS" | "ALL_TEACHERS" | "ALL" | "SPECIFIC";

export const CATEGORY_LABELS: Record<NotiCategory, string> = {
  REGISTRATION: "Đăng ký môn học",
  SCHEDULE: "Lịch học",
  CLASS: "Lớp học phần",
  SYSTEM: "Hệ thống",
  OTHER: "Khác",
};

export const AUDIENCE_LABELS: Record<NotiAudience, string> = {
  ALL: "Tất cả người dùng",
  ALL_STUDENTS: "Tất cả sinh viên",
  ALL_TEACHERS: "Tất cả giáo viên",
  SPECIFIC: "Danh sách cụ thể",
};

export interface Notification {
  id: number;
  title: string;
  body: string;
  category: NotiCategory;
  category_display: string;
  audience: NotiAudience;
  audience_display: string;
  sender: number | null;
  sender_username: string | null;
  recipients: number[];
  created_at: string;
}

export type NotificationInput = {
  title: string;
  body: string;
  category: NotiCategory;
  audience: NotiAudience;
  recipients?: number[];
};

export async function listNotifications(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<Paginated<Notification>> {
  const res = await api.get<Paginated<Notification>>("/notifications/", { params });
  return res.data;
}

export async function createNotification(
  payload: NotificationInput,
): Promise<Notification> {
  const res = await api.post<Notification>("/notifications/", payload);
  return res.data;
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}/`);
}

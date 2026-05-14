import type { Role } from "@/types";

export function profilePathForRole(role: Role): string {
  if (role === "ADMIN") return "/admin/profile";
  if (role === "TEACHER") return "/teacher/profile";
  return "/student/profile";
}

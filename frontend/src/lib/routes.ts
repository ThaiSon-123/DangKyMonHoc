import type { Role } from "@/types";

export function profilePathForRole(role: Role): string {
  if (role === "ADMIN") return "/admin/profile";
  if (role === "TEACHER") return "/teacher/profile";
  return "/student/profile";
}

export function loginPathForRole(role: Role | null | undefined): string {
  return role === "ADMIN" ? "/admin/login" : "/login";
}

export function loginPathForPathname(pathname: string): string {
  return pathname.startsWith("/admin") ? "/admin/login" : "/login";
}

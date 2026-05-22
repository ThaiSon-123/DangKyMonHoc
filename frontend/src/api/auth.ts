import { api } from "./client";
import type { LoginResponse, User } from "@/types";

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/auth/login/", { username, password });
  return res.data;
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<User>("/accounts/users/me/");
  return res.data;
}

export async function forgotPassword(email: string): Promise<{ detail: string }> {
  const res = await api.post<{ detail: string }>("/auth/forgot-password/", { email });
  return res.data;
}

export async function resetPassword(payload: {
  email: string;
  pin: string;
  new_password: string;
}): Promise<{ detail: string }> {
  const res = await api.post<{ detail: string }>("/auth/reset-password/", payload);
  return res.data;
}

export async function changeMyPassword(payload: {
  old_password: string;
  new_password: string;
}): Promise<{ detail: string }> {
  const res = await api.post<{ detail: string }>(
    "/accounts/users/change-password/",
    payload,
  );
  return res.data;
}

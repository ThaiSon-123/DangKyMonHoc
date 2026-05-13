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

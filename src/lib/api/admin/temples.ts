import type { Temple, TempleInput } from "@/types";
import { apiClient } from "../client";

type TempleResponse = { temple: Temple };

export function createTemple(
  input: TempleInput,
  authToken: string,
): Promise<TempleResponse> {
  return apiClient<TempleResponse>("/admin/temples", {
    method: "POST",
    body: JSON.stringify(input),
    authToken,
  });
}

export function updateTemple(
  id: number,
  input: Partial<TempleInput>,
  authToken: string,
): Promise<TempleResponse> {
  return apiClient<TempleResponse>(`/admin/temples/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    authToken,
  });
}

export function deleteTemple(id: number, authToken: string): Promise<void> {
  return apiClient<void>(`/admin/temples/${id}`, {
    method: "DELETE",
    authToken,
  });
}

import type { Greentea, GreenteaInput } from "@/types";
import { apiClient } from "../client";

type GreenteaResponse = { greentea: Greentea };

export function createGreentea(
  input: GreenteaInput,
  authToken: string,
): Promise<GreenteaResponse> {
  return apiClient<GreenteaResponse>("/admin/greenteas", {
    method: "POST",
    body: JSON.stringify(input),
    authToken,
  });
}

export function updateGreentea(
  id: number,
  input: Partial<GreenteaInput>,
  authToken: string,
): Promise<GreenteaResponse> {
  return apiClient<GreenteaResponse>(`/admin/greenteas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
    authToken,
  });
}

export function deleteGreentea(id: number, authToken: string): Promise<void> {
  return apiClient<void>(`/admin/greenteas/${id}`, {
    method: "DELETE",
    authToken,
  });
}

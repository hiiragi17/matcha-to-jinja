import type { Greentea } from "@/types";
import { apiClient } from "@/lib/api/client";

export type GreenteaInput = {
  name: string;
  description: string;
  address: string;
  access: string;
  phone_number: string;
  business_hours: string;
  holiday: string;
  homepage: string;
  closed: boolean;
  img: string;
  latitude: number;
  longitude: number;
  genre_ids: number[];
};

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

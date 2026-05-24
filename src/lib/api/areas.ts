import type { AreaListResponse } from "@/types";
import { apiClient } from "./client";

export function getAreas(): Promise<AreaListResponse> {
  return apiClient<AreaListResponse>("/areas");
}

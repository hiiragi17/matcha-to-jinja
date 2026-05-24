import type { GenreListResponse } from "@/types";
import { apiClient } from "./client";

export function getGenres(): Promise<GenreListResponse> {
  return apiClient<GenreListResponse>("/genres");
}

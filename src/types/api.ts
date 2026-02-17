export interface Area {
  id: number;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface NearbySpot {
  id: number;
  name: string;
  distance_meters: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

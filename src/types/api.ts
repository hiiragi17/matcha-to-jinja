import type { Greentea } from "./greentea";
import type { Temple } from "./temple";
import type { Genre } from "./genre";
import type { Area } from "./area";
import type { Comment } from "./comment";

export interface Meta {
  current_page: number;
  total_pages: number;
  total_count: number;
}

export interface NearbySpot {
  id: number;
  name: string;
  distance_meters: number;
}

export interface GreenteaDetail extends Greentea {
  nearby_temples: NearbySpot[];
  comments: Comment[];
}

export interface TempleDetail extends Temple {
  nearby_greenteas: NearbySpot[];
  comments: Comment[];
}

export interface GreenteaListResponse {
  greenteas: Greentea[];
  meta: Meta;
}

export interface TempleListResponse {
  temples: Temple[];
  meta: Meta;
}

export interface GreenteaDetailResponse {
  greentea: GreenteaDetail;
}

export interface TempleDetailResponse {
  temple: TempleDetail;
}

export interface AreaListResponse {
  areas: Area[];
}

export interface GenreListResponse {
  genres: Genre[];
}

export interface NearbyResponse {
  greenteas: NearbySpot[];
  temples: NearbySpot[];
}

import type { Genre } from "./genre";

export interface GreenteaInput {
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
}

export interface Greentea {
  id: number;
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
  genres: Genre[];
  likes_count: number;
  liked_by_current_user?: boolean;
}

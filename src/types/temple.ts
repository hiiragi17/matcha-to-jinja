import type { Area } from "./area";

export interface Temple {
  id: number;
  name: string;
  description: string;
  address: string;
  access: string;
  phone_number: string;
  business_hours: string;
  holiday: string;
  homepage: string;
  img: string;
  latitude: number;
  longitude: number;
  areas: Area[];
  likes_count: number;
  liked_by_current_user?: boolean;
}

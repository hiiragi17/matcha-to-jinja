import type { Genre, NearbySpot } from '@/types/api';

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
  nearby_temples?: NearbySpot[];
}

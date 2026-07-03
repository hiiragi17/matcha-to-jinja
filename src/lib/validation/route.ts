import { z } from "zod";
import type { RouteInput } from "@/types";

// モデルルート作成/編集フォームのスキーマ。
// name は必須（非空）、spots は 1 件以上。transport は任意（未設定は null 扱い）。
export const transportSchema = z.enum(["walk", "train", "bus", "car"]).nullable();

export const routeSpotSchema = z.object({
  spot_type: z.enum(["greentea", "temple"]),
  spot_id: z.number(),
  transport: transportSchema,
});

export const routeFormSchema = z.object({
  name: z.string().trim().min(1, { message: "コース名は必須です" }),
  description: z.string(),
  spots: z
    .array(routeSpotSchema)
    .min(1, { message: "スポットを1件以上追加してください" }),
});

export type RouteFormValues = z.infer<typeof routeFormSchema>;

// フォーム値を API の RouteInput に整形する。
// includeSpots=false のときは spots を省略し、name/description のみの部分更新にする
// （ハンドオフ doc: spots を渡さない PATCH は経路再計算を行わない）。
export function toRouteInput(
  values: RouteFormValues,
  includeSpots = true,
): RouteInput {
  const input: RouteInput = {
    name: values.name.trim(),
    description: values.description,
  };
  if (includeSpots) {
    input.spots = values.spots.map((s) => ({
      spot_type: s.spot_type,
      spot_id: s.spot_id,
      transport: s.transport,
    }));
  }
  return input;
}

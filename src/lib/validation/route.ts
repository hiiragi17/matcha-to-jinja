import { z } from "zod";
import type { RouteInput, SpotType } from "@/types";

// zod enum の値は types/route.ts の union を単一の真実として派生させる
// （新しい spot_type を追加しても両者がずれないようにする）。
const SPOT_TYPES = ["greentea", "temple"] as const satisfies readonly SpotType[];

// モデルルート作成/編集フォームのスキーマ。
// name は必須（非空）、spots は 1 件以上。移動手段はユーザーが選ぶのではなく
// バックエンドが自動決定するため、フォーム/リクエストには含めない。
export const routeSpotSchema = z.object({
  spot_type: z.enum(SPOT_TYPES),
  spot_id: z.number(),
});

export const routeFormSchema = z.object({
  name: z.string().trim().min(1, { error: "コース名は必須です" }),
  description: z.string(),
  spots: z
    .array(routeSpotSchema)
    .min(1, { error: "スポットを1件以上追加してください" }),
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
    }));
  }
  return input;
}

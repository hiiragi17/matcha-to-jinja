import { z } from "zod";

// PATCH /api/v1/current_user の body（{ user: { name } }）に対応するフォームスキーマ。
// Rails 側は `validates :name, presence: true` のみ（他に編集可能フィールドが無い）。
export const profileFormSchema = z.object({
  name: z.string().trim().min(1, { error: "表示名は必須です" }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

import { z } from "zod";

// 任意入力の URL フィールド（img / homepage）。空文字は許容し、値があるときだけ
// http(s):// 始まりを要求する。Rails 側のバリデーションと表記を揃える。
const optionalHttpUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), {
    message: "http(s):// から始まる URL を入力してください",
  });

// 緯度・経度は number 入力（valueAsNumber）から渡る。未入力は undefined / NaN に
// なるが、zod v4 の z.number() はどちらも invalid_type として弾くため、その型エラー
// メッセージを日本語の必須メッセージに差し替える。妥当な数値のときだけ範囲を見る。
const latitude = z
  .number({ error: "緯度を入力してください" })
  .min(-90, { error: "緯度は -90〜90 の範囲で入力してください" })
  .max(90, { error: "緯度は -90〜90 の範囲で入力してください" });

const longitude = z
  .number({ error: "経度を入力してください" })
  .min(-180, { error: "経度は -180〜180 の範囲で入力してください" })
  .max(180, { error: "経度は -180〜180 の範囲で入力してください" });

// GreenteaInput（作成・更新 body）に一致するフォームスキーマ。
// 必須は name / address のみ（issue #74 の方針）。その他は空文字を許容する。
export const greenteaFormSchema = z.object({
  name: z.string().trim().min(1, { message: "店名は必須です" }),
  description: z.string(),
  address: z.string().trim().min(1, { message: "住所は必須です" }),
  access: z.string(),
  phone_number: z.string(),
  business_hours: z.string(),
  holiday: z.string(),
  homepage: optionalHttpUrl,
  closed: z.boolean(),
  img: optionalHttpUrl,
  latitude,
  longitude,
  genre_ids: z.array(z.number()),
});

export type GreenteaFormValues = z.infer<typeof greenteaFormSchema>;

import { describe, expect, it } from "vitest";
import { greenteaFormSchema } from "@/lib/validation/greentea";

const validInput = {
  name: "茶寮都路里",
  description: "宇治抹茶のパフェ",
  address: "京都市東山区祇園町南側",
  access: "祇園四条駅から徒歩5分",
  phone_number: "075-000-0001",
  business_hours: "10:00-21:00",
  holiday: "不定休",
  homepage: "https://example.com/tsujiri",
  closed: false,
  img: "https://example.com/img.png",
  latitude: 35.0036,
  longitude: 135.7714,
  genre_ids: [1, 2],
};

describe("greenteaFormSchema", () => {
  it("妥当な入力を通す", () => {
    const result = greenteaFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("name が空だとエラー", () => {
    const result = greenteaFormSchema.safeParse({ ...validInput, name: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("address が空だとエラー", () => {
    const result = greenteaFormSchema.safeParse({ ...validInput, address: "" });
    expect(result.success).toBe(false);
  });

  it("img / homepage は空文字を許容する", () => {
    const result = greenteaFormSchema.safeParse({
      ...validInput,
      img: "",
      homepage: "",
    });
    expect(result.success).toBe(true);
  });

  it("img が http(s) 以外だとエラー", () => {
    const result = greenteaFormSchema.safeParse({
      ...validInput,
      img: "ftp://example.com/x.png",
    });
    expect(result.success).toBe(false);
  });

  it("緯度が範囲外だとエラー", () => {
    const result = greenteaFormSchema.safeParse({ ...validInput, latitude: 120 });
    expect(result.success).toBe(false);
  });

  it("緯度が未入力(NaN)だとエラー", () => {
    const result = greenteaFormSchema.safeParse({
      ...validInput,
      latitude: NaN,
    });
    expect(result.success).toBe(false);
  });

  it("文字列フィールドは trim される", () => {
    const result = greenteaFormSchema.safeParse({
      ...validInput,
      name: "  茶寮都路里  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("茶寮都路里");
    }
  });
});

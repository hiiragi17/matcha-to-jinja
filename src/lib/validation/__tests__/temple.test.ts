import { describe, expect, it } from "vitest";
import { templeFormSchema } from "@/lib/validation/temple";

const validInput = {
  name: "八坂神社",
  description: "祇園さん",
  address: "京都市東山区祇園町北側625",
  access: "祇園四条駅から徒歩5分",
  phone_number: "075-000-0002",
  business_hours: "終日参拝可",
  holiday: "なし",
  homepage: "https://example.com/yasaka",
  img: "https://example.com/img.png",
  latitude: 35.0036,
  longitude: 135.7785,
  area_ids: [1, 2],
};

describe("templeFormSchema", () => {
  it("妥当な入力を通す", () => {
    const result = templeFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("name が空だとエラー", () => {
    const result = templeFormSchema.safeParse({ ...validInput, name: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("address が空だとエラー", () => {
    const result = templeFormSchema.safeParse({ ...validInput, address: "" });
    expect(result.success).toBe(false);
  });

  it("img / homepage は空文字を許容する", () => {
    const result = templeFormSchema.safeParse({
      ...validInput,
      img: "",
      homepage: "",
    });
    expect(result.success).toBe(true);
  });

  it("img が http(s) 以外だとエラー", () => {
    const result = templeFormSchema.safeParse({
      ...validInput,
      img: "ftp://example.com/x.png",
    });
    expect(result.success).toBe(false);
  });

  it("緯度が範囲外だとエラー", () => {
    const result = templeFormSchema.safeParse({ ...validInput, latitude: 120 });
    expect(result.success).toBe(false);
  });

  it("緯度が未入力(NaN)だとエラー", () => {
    const result = templeFormSchema.safeParse({
      ...validInput,
      latitude: NaN,
    });
    expect(result.success).toBe(false);
  });

  it("文字列フィールドは trim される", () => {
    const result = templeFormSchema.safeParse({
      ...validInput,
      name: "  八坂神社  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("八坂神社");
    }
  });
});

import { describe, expect, it } from "vitest";
import { hasImage } from "@/lib/utils/image";

describe("hasImage", () => {
  it("URL があれば true", () => {
    expect(hasImage("https://example.com/x.png")).toBe(true);
  });

  it("空文字は false", () => {
    expect(hasImage("")).toBe(false);
  });

  it("空白のみも false", () => {
    expect(hasImage("   ")).toBe(false);
  });

  it("null / undefined も false", () => {
    expect(hasImage(null)).toBe(false);
    expect(hasImage(undefined)).toBe(false);
  });
});

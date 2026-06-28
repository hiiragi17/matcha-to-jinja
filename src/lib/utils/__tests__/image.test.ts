import { describe, expect, it } from "vitest";
import {
  NO_IMAGE_PLACEHOLDER,
  imageSrcOrPlaceholder,
} from "@/lib/utils/image";

describe("imageSrcOrPlaceholder", () => {
  it("URL があればそのまま返す", () => {
    expect(imageSrcOrPlaceholder("https://example.com/x.png")).toBe(
      "https://example.com/x.png",
    );
  });

  it("空文字はプレースホルダにフォールバックする", () => {
    expect(imageSrcOrPlaceholder("")).toBe(NO_IMAGE_PLACEHOLDER);
  });

  it("空白のみもプレースホルダにフォールバックする", () => {
    expect(imageSrcOrPlaceholder("   ")).toBe(NO_IMAGE_PLACEHOLDER);
  });

  it("null / undefined もプレースホルダにフォールバックする", () => {
    expect(imageSrcOrPlaceholder(null)).toBe(NO_IMAGE_PLACEHOLDER);
    expect(imageSrcOrPlaceholder(undefined)).toBe(NO_IMAGE_PLACEHOLDER);
  });

  it("プレースホルダは data:image/svg+xml の URI", () => {
    expect(NO_IMAGE_PLACEHOLDER.startsWith("data:image/svg+xml,")).toBe(true);
  });
});

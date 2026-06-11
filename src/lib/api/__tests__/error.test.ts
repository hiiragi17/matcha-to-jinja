import { describe, expect, it } from "vitest";
import {
  ApiError,
  getApiErrorMessage,
  getErrorData,
  getErrorStatus,
  isForbidden,
  isUnauthorized,
  isValidationError,
} from "../error";

describe("error ユーティリティ", () => {
  describe("getErrorStatus / getErrorData", () => {
    it("ApiError から status と data を取り出す", () => {
      const err = new ApiError(422, { errors: ["x"] });
      expect(getErrorStatus(err)).toBe(422);
      expect(getErrorData(err)).toEqual({ errors: ["x"] });
    });

    it("ApiError 以外（ネットワーク断等）では null を返す", () => {
      expect(getErrorStatus(new Error("network"))).toBeNull();
      expect(getErrorStatus("boom")).toBeNull();
      expect(getErrorData(new Error("network"))).toBeNull();
    });
  });

  describe("isUnauthorized / isForbidden / isValidationError", () => {
    it("対応する status のときだけ true", () => {
      expect(isUnauthorized(new ApiError(401, null))).toBe(true);
      expect(isUnauthorized(new ApiError(403, null))).toBe(false);
      expect(isForbidden(new ApiError(403, null))).toBe(true);
      expect(isForbidden(new ApiError(401, null))).toBe(false);
      expect(isValidationError(new ApiError(422, null))).toBe(true);
      expect(isValidationError(new ApiError(500, null))).toBe(false);
    });

    it("ApiError 以外は常に false", () => {
      expect(isUnauthorized(new Error("x"))).toBe(false);
      expect(isForbidden(undefined)).toBe(false);
      expect(isValidationError(null)).toBe(false);
    });
  });

  describe("getApiErrorMessage", () => {
    it("{ errors: [...] } を ' / ' で連結する", () => {
      const err = new ApiError(422, {
        errors: ["本文を入力してください", "500文字以内にしてください"],
      });
      expect(getApiErrorMessage(err, "fallback")).toBe(
        "本文を入力してください / 500文字以内にしてください",
      );
    });

    it("{ error: '...' } / { message: '...' } を拾う", () => {
      expect(getApiErrorMessage(new ApiError(422, { error: "だめ" }), "fb")).toBe(
        "だめ",
      );
      expect(
        getApiErrorMessage(new ApiError(422, { message: "むり" }), "fb"),
      ).toBe("むり");
    });

    it("errors が空配列・非文字列のみなら fallback", () => {
      expect(getApiErrorMessage(new ApiError(422, { errors: [] }), "fb")).toBe(
        "fb",
      );
      expect(
        getApiErrorMessage(new ApiError(422, { errors: [1, 2] }), "fb"),
      ).toBe("fb");
    });

    it("ボディが無い / ApiError 以外なら fallback", () => {
      expect(getApiErrorMessage(new ApiError(500, null), "fb")).toBe("fb");
      expect(getApiErrorMessage(new Error("network"), "fb")).toBe("fb");
    });
  });
});

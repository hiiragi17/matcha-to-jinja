import { beforeEach, describe, expect, it } from "vitest";
import {
  addGreenteaComment,
  addGreenteaLike,
  addTempleLike,
  deleteGreenteaComment,
  extractMockUserId,
  getGreenteaLikeDelta,
  getGreenteaLikedIds,
  getTempleLikeDelta,
  getTempleLikedIds,
  listGreenteaComments,
  removeGreenteaLike,
  resetMockStore,
} from "../state";

beforeEach(() => {
  resetMockStore();
});

describe("resetMockStore", () => {
  it("各テスト前に呼ぶことで前テストの状態が残らない", () => {
    addGreenteaLike("alice", 1);
    expect(getGreenteaLikedIds("alice").has(1)).toBe(true);

    resetMockStore();
    expect(getGreenteaLikedIds("alice").size).toBe(0);
    expect(getGreenteaLikeDelta(1)).toBe(0);
  });
});

describe("greentea likes", () => {
  it("同一ユーザーの同一スポット重複 like は冪等（delta も 1 のまま）", () => {
    expect(addGreenteaLike("alice", 1)).toBe(true);
    expect(addGreenteaLike("alice", 1)).toBe(false);
    expect(getGreenteaLikedIds("alice").size).toBe(1);
    expect(getGreenteaLikeDelta(1)).toBe(1);
  });

  it("remove で delta が -1 され、未 like の remove は false", () => {
    addGreenteaLike("alice", 1);
    expect(removeGreenteaLike("alice", 1)).toBe(true);
    expect(getGreenteaLikedIds("alice").has(1)).toBe(false);
    expect(getGreenteaLikeDelta(1)).toBe(0);

    expect(removeGreenteaLike("alice", 1)).toBe(false);
  });

  it("ユーザーごとに like 集合が独立している", () => {
    addGreenteaLike("alice", 1);
    addGreenteaLike("bob", 2);
    expect(getGreenteaLikedIds("alice")).toEqual(new Set([1]));
    expect(getGreenteaLikedIds("bob")).toEqual(new Set([2]));
  });
});

describe("temple likes", () => {
  it("追加 / 集合 / delta が独立して機能する", () => {
    addTempleLike("alice", 5);
    addTempleLike("alice", 7);
    addTempleLike("bob", 5);
    expect(getTempleLikedIds("alice")).toEqual(new Set([5, 7]));
    expect(getTempleLikedIds("bob")).toEqual(new Set([5]));
    expect(getTempleLikeDelta(5)).toBe(2);
    expect(getTempleLikeDelta(7)).toBe(1);
  });
});

describe("greentea comments", () => {
  const baseComment = {
    body: "おいしかった",
    user: { id: 99, name: "alice-name" },
  };

  it("追加したコメントは viewer が owner と一致するときだけ owned_by_current_user=true", () => {
    const created = addGreenteaComment(1, "alice", baseComment);
    const aliceView = listGreenteaComments(1, "alice");
    const bobView = listGreenteaComments(1, "bob");
    const anonView = listGreenteaComments(1, null);

    expect(aliceView.find((c) => c.id === created.id)?.owned_by_current_user).toBe(
      true,
    );
    expect(bobView.find((c) => c.id === created.id)?.owned_by_current_user).toBe(
      false,
    );
    expect(anonView.find((c) => c.id === created.id)?.owned_by_current_user).toBe(
      false,
    );
  });

  it("他人による削除は forbidden、所有者の削除は deleted", () => {
    const created = addGreenteaComment(1, "alice", baseComment);
    expect(deleteGreenteaComment(created.id, "bob")).toBe("forbidden");
    expect(deleteGreenteaComment(created.id, "alice")).toBe("deleted");
    expect(deleteGreenteaComment(created.id, "alice")).toBe("not_found");
  });
});

describe("extractMockUserId", () => {
  it("Bearer mock:<id> から id を取り出す", () => {
    const h = new Headers({ Authorization: "Bearer mock:alice" });
    expect(extractMockUserId(h)).toBe("alice");
  });

  it("Authorization ヘッダが無いと null", () => {
    expect(extractMockUserId(new Headers())).toBeNull();
  });

  it("Bearer 以外のスキームは null", () => {
    const h = new Headers({ Authorization: "Basic mock:alice" });
    expect(extractMockUserId(h)).toBeNull();
  });

  it("mock: プレフィックスが無いトークン（実 JWT 等）は null", () => {
    const h = new Headers({ Authorization: "Bearer eyJ.real.jwt" });
    expect(extractMockUserId(h)).toBeNull();
  });

  it("mock: の後ろが空の場合は null", () => {
    const h = new Headers({ Authorization: "Bearer mock:" });
    expect(extractMockUserId(h)).toBeNull();
  });
});

// モックモード（NEXT_PUBLIC_USE_MOCK=true）でのみ使うインメモリ状態。
// 本番では使わないため永続化は意図しない。プロセスが落ちると消える。
//
// ユーザーは Authorization: Bearer "mock:<id>" から識別する。
// Rails JWT (#15) 連携後はこのファイル自体が不要になる想定。
//
// Next.js dev サーバーは HMR で module-level の変数がリセットされてしまい、
// 開発中にいいね・コメントが突然消えて混乱するため、globalThis にぶら下げる。

import type { Comment } from "@/types";

type UserId = string;
type CommentRecord = { comment: Comment; ownerId: UserId };

export type DeleteResult = "deleted" | "not_found" | "forbidden";

type MockStore = {
  greenteaLikes: Map<UserId, Set<number>>;
  templeLikes: Map<UserId, Set<number>>;
  greenteaComments: Map<number, CommentRecord[]>;
  templeComments: Map<number, CommentRecord[]>;
  greenteaLikeCountDelta: Map<number, number>;
  templeLikeCountDelta: Map<number, number>;
  nextCommentId: { value: number };
};

const globalKey = Symbol.for("matcha-to-jinja.mock-store");
type GlobalWithStore = typeof globalThis & { [globalKey]?: MockStore };

const store: MockStore = ((): MockStore => {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) {
    g[globalKey] = {
      greenteaLikes: new Map(),
      templeLikes: new Map(),
      greenteaComments: new Map(),
      templeComments: new Map(),
      greenteaLikeCountDelta: new Map(),
      templeLikeCountDelta: new Map(),
      nextCommentId: { value: 1000 },
    };
  }
  return g[globalKey]!;
})();

function ensureSet<K, V>(map: Map<K, Set<V>>, key: K): Set<V> {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  return set;
}

function ensureList<K>(
  map: Map<K, CommentRecord[]>,
  key: K,
): CommentRecord[] {
  let list = map.get(key);
  if (!list) {
    list = [];
    map.set(key, list);
  }
  return list;
}

export function getGreenteaLikedIds(userId: UserId): Set<number> {
  return store.greenteaLikes.get(userId) ?? new Set();
}

export function getTempleLikedIds(userId: UserId): Set<number> {
  return store.templeLikes.get(userId) ?? new Set();
}

export function addGreenteaLike(userId: UserId, greenteaId: number): boolean {
  const set = ensureSet(store.greenteaLikes, userId);
  if (set.has(greenteaId)) return false;
  set.add(greenteaId);
  store.greenteaLikeCountDelta.set(
    greenteaId,
    (store.greenteaLikeCountDelta.get(greenteaId) ?? 0) + 1,
  );
  return true;
}

export function removeGreenteaLike(
  userId: UserId,
  greenteaId: number,
): boolean {
  const set = store.greenteaLikes.get(userId);
  if (!set?.delete(greenteaId)) return false;
  store.greenteaLikeCountDelta.set(
    greenteaId,
    (store.greenteaLikeCountDelta.get(greenteaId) ?? 0) - 1,
  );
  return true;
}

export function addTempleLike(userId: UserId, templeId: number): boolean {
  const set = ensureSet(store.templeLikes, userId);
  if (set.has(templeId)) return false;
  set.add(templeId);
  store.templeLikeCountDelta.set(
    templeId,
    (store.templeLikeCountDelta.get(templeId) ?? 0) + 1,
  );
  return true;
}

export function removeTempleLike(userId: UserId, templeId: number): boolean {
  const set = store.templeLikes.get(userId);
  if (!set?.delete(templeId)) return false;
  store.templeLikeCountDelta.set(
    templeId,
    (store.templeLikeCountDelta.get(templeId) ?? 0) - 1,
  );
  return true;
}

export function getGreenteaLikeDelta(greenteaId: number): number {
  return store.greenteaLikeCountDelta.get(greenteaId) ?? 0;
}

export function getTempleLikeDelta(templeId: number): number {
  return store.templeLikeCountDelta.get(templeId) ?? 0;
}

export function listGreenteaComments(
  greenteaId: number,
  viewerId: UserId | null,
): Comment[] {
  return (store.greenteaComments.get(greenteaId) ?? []).map((r) => ({
    ...r.comment,
    owned_by_current_user: viewerId !== null && r.ownerId === viewerId,
  }));
}

export function listTempleComments(
  templeId: number,
  viewerId: UserId | null,
): Comment[] {
  return (store.templeComments.get(templeId) ?? []).map((r) => ({
    ...r.comment,
    owned_by_current_user: viewerId !== null && r.ownerId === viewerId,
  }));
}

export function addGreenteaComment(
  greenteaId: number,
  ownerId: UserId,
  comment: Omit<Comment, "id" | "created_at">,
): Comment {
  const created: Comment = {
    ...comment,
    id: store.nextCommentId.value++,
    created_at: new Date().toISOString(),
  };
  ensureList(store.greenteaComments, greenteaId).unshift({
    comment: created,
    ownerId,
  });
  return created;
}

export function addTempleComment(
  templeId: number,
  ownerId: UserId,
  comment: Omit<Comment, "id" | "created_at">,
): Comment {
  const created: Comment = {
    ...comment,
    id: store.nextCommentId.value++,
    created_at: new Date().toISOString(),
  };
  ensureList(store.templeComments, templeId).unshift({
    comment: created,
    ownerId,
  });
  return created;
}

export function deleteGreenteaComment(
  commentId: number,
  userId: UserId,
): DeleteResult {
  for (const list of store.greenteaComments.values()) {
    const idx = list.findIndex((r) => r.comment.id === commentId);
    if (idx >= 0) {
      if (list[idx].ownerId !== userId) return "forbidden";
      list.splice(idx, 1);
      return "deleted";
    }
  }
  return "not_found";
}

export function deleteTempleComment(
  commentId: number,
  userId: UserId,
): DeleteResult {
  for (const list of store.templeComments.values()) {
    const idx = list.findIndex((r) => r.comment.id === commentId);
    if (idx >= 0) {
      if (list[idx].ownerId !== userId) return "forbidden";
      list.splice(idx, 1);
      return "deleted";
    }
  }
  return "not_found";
}

// Authorization: Bearer "mock:<id>" からユーザー ID を取り出す。
// 形式が異なるトークン（実 JWT 等）が来た場合は null。
export function extractMockUserId(headers: Headers): string | null {
  const auth = headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length);
  if (!token.startsWith("mock:")) return null;
  const id = token.slice("mock:".length);
  return id.length > 0 ? id : null;
}

// モックモード（NEXT_PUBLIC_USE_MOCK=true）でのみ使うインメモリ状態。
// 本番では使わないため永続化は意図しない。プロセスが落ちると消える。
//
// ユーザーは Authorization: Bearer "mock:<id>" から識別する。
// Rails JWT (#15) 連携後はこのファイル自体が不要になる想定。

import type { Comment } from "@/types";

type UserId = string;
type CommentRecord = { comment: Comment; ownerId: UserId };

const greenteaLikes = new Map<UserId, Set<number>>();
const templeLikes = new Map<UserId, Set<number>>();

const greenteaComments = new Map<number, CommentRecord[]>();
const templeComments = new Map<number, CommentRecord[]>();

const greenteaLikeCountDelta = new Map<number, number>();
const templeLikeCountDelta = new Map<number, number>();

let nextCommentId = 1000;

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
  return greenteaLikes.get(userId) ?? new Set();
}

export function getTempleLikedIds(userId: UserId): Set<number> {
  return templeLikes.get(userId) ?? new Set();
}

export function addGreenteaLike(userId: UserId, greenteaId: number): boolean {
  const set = ensureSet(greenteaLikes, userId);
  if (set.has(greenteaId)) return false;
  set.add(greenteaId);
  greenteaLikeCountDelta.set(
    greenteaId,
    (greenteaLikeCountDelta.get(greenteaId) ?? 0) + 1,
  );
  return true;
}

export function removeGreenteaLike(
  userId: UserId,
  greenteaId: number,
): boolean {
  const set = greenteaLikes.get(userId);
  if (!set?.delete(greenteaId)) return false;
  greenteaLikeCountDelta.set(
    greenteaId,
    (greenteaLikeCountDelta.get(greenteaId) ?? 0) - 1,
  );
  return true;
}

export function addTempleLike(userId: UserId, templeId: number): boolean {
  const set = ensureSet(templeLikes, userId);
  if (set.has(templeId)) return false;
  set.add(templeId);
  templeLikeCountDelta.set(
    templeId,
    (templeLikeCountDelta.get(templeId) ?? 0) + 1,
  );
  return true;
}

export function removeTempleLike(userId: UserId, templeId: number): boolean {
  const set = templeLikes.get(userId);
  if (!set?.delete(templeId)) return false;
  templeLikeCountDelta.set(
    templeId,
    (templeLikeCountDelta.get(templeId) ?? 0) - 1,
  );
  return true;
}

export function getGreenteaLikeDelta(greenteaId: number): number {
  return greenteaLikeCountDelta.get(greenteaId) ?? 0;
}

export function getTempleLikeDelta(templeId: number): number {
  return templeLikeCountDelta.get(templeId) ?? 0;
}

export function listGreenteaComments(
  greenteaId: number,
  viewerId: UserId | null,
): Comment[] {
  return (greenteaComments.get(greenteaId) ?? []).map((r) => ({
    ...r.comment,
    owned_by_current_user: viewerId !== null && r.ownerId === viewerId,
  }));
}

export function listTempleComments(
  templeId: number,
  viewerId: UserId | null,
): Comment[] {
  return (templeComments.get(templeId) ?? []).map((r) => ({
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
    id: nextCommentId++,
    created_at: new Date().toISOString(),
  };
  ensureList(greenteaComments, greenteaId).unshift({
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
    id: nextCommentId++,
    created_at: new Date().toISOString(),
  };
  ensureList(templeComments, templeId).unshift({ comment: created, ownerId });
  return created;
}

export function deleteGreenteaComment(
  commentId: number,
  userId: UserId,
): boolean {
  for (const list of greenteaComments.values()) {
    const idx = list.findIndex(
      (r) => r.comment.id === commentId && r.ownerId === userId,
    );
    if (idx >= 0) {
      list.splice(idx, 1);
      return true;
    }
  }
  return false;
}

export function deleteTempleComment(
  commentId: number,
  userId: UserId,
): boolean {
  for (const list of templeComments.values()) {
    const idx = list.findIndex(
      (r) => r.comment.id === commentId && r.ownerId === userId,
    );
    if (idx >= 0) {
      list.splice(idx, 1);
      return true;
    }
  }
  return false;
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

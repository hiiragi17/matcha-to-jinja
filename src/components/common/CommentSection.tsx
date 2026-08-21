"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { HiTrash } from "react-icons/hi2";
import {
  createGreenteaComment,
  createTempleComment,
  deleteGreenteaComment,
  deleteTempleComment,
  getApiErrorMessage,
  isForbidden,
  isUnauthorized,
  isValidationError,
} from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { Comment } from "@/types";

type CommentSectionProps = {
  kind: "greentea" | "temple";
  targetId: number;
  initialComments: Comment[];
  callbackUrl: string;
};

const MAX_BODY_LENGTH = 500;

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function CommentSection({
  kind,
  targetId,
  initialComments,
  callbackUrl,
}: CommentSectionProps) {
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler(callbackUrl);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [deleting, startDelete] = useTransition();

  const trimmed = body.trim();
  const tooLong = body.length > MAX_BODY_LENGTH;
  const canSubmit = !!authToken && trimmed.length > 0 && !tooLong && !submitting;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authToken || trimmed.length === 0 || tooLong) return;
    setSubmitError(null);

    startSubmit(async () => {
      try {
        // レスポンス自体が空（204 / 空ボディ）でも分割代入で TypeError に
        // ならないよう、いったん受けてから取り出す。
        const created =
          kind === "greentea"
            ? await createGreenteaComment(targetId, trimmed, authToken)
            : await createTempleComment(targetId, trimmed, authToken);
        const comment = created?.comment;
        setBody("");
        // 投稿は成功したのにレスポンスから口コミ本体を取り出せないケース
        // （API 側のルートキーずれ等の契約不一致）で、本文も投稿者も欠けた
        // 「匿名ユーザー」のカードを一覧へ差し込んでしまわないようにする。
        if (!comment?.id) {
          setSubmitError(
            "投稿は完了しましたが、表示の更新に失敗しました。ページを再読み込みしてください。",
          );
          return;
        }
        setComments((prev) => [
          { ...comment, owned_by_current_user: true },
          ...prev,
        ]);
      } catch (e) {
        if (isUnauthorized(e)) {
          await handleSessionExpired();
          return;
        }
        if (isValidationError(e)) {
          setSubmitError(getApiErrorMessage(e, "投稿内容を確認してください。"));
          return;
        }
        setSubmitError("投稿に失敗しました。時間を置いてお試しください。");
      }
    });
  };

  const handleDelete = (commentId: number) => {
    if (!authToken) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm("この口コミを削除しますか？");
      if (!ok) return;
    }
    setDeleteError(null);
    const snapshot = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    startDelete(async () => {
      try {
        if (kind === "greentea") {
          await deleteGreenteaComment(commentId, authToken);
        } else {
          await deleteTempleComment(commentId, authToken);
        }
      } catch (e) {
        setComments(snapshot);
        if (isUnauthorized(e)) {
          await handleSessionExpired();
          return;
        }
        if (isForbidden(e)) {
          setDeleteError("この口コミを削除する権限がありません。");
          return;
        }
        setDeleteError("削除に失敗しました。");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {authToken ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 border border-line-soft bg-paper px-5 py-5"
        >
          <label
            htmlFor="comment-body"
            className="font-sans-jp text-[10px] tracking-[0.3em] text-olive"
          >
            口コミを書く / WRITE
          </label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            // ハードカットは + 100 文字までで、上限超過は文字数カウンタを
            // 赤くしてユーザーに気付かせ送信ボタンを無効化する UX を取る。
            maxLength={MAX_BODY_LENGTH + 100}
            placeholder="感想や訪問のメモを残してみましょう"
            disabled={submitting}
            className="w-full resize-y border border-line bg-washi px-3 py-2 font-serif-jp text-sm leading-[1.9] text-ink focus:outline-none focus:ring-1 focus:ring-olive disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-3">
            <p
              className={`font-sans-jp text-[10px] tracking-[0.15em] ${
                tooLong ? "text-bengara" : "text-muted"
              }`}
            >
              {body.length} / {MAX_BODY_LENGTH}
            </p>
            <button
              type="submit"
              disabled={!canSubmit}
              className="border border-olive bg-olive px-5 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-paper transition-colors hover:bg-olive-dark disabled:cursor-not-allowed disabled:border-line disabled:bg-line disabled:text-muted"
            >
              {submitting ? "送信中…" : "投稿する"}
            </button>
          </div>
          {submitError && (
            <p role="alert" className="font-sans-jp text-xs text-bengara">
              {submitError}
            </p>
          )}
        </form>
      ) : (
        <div className="border border-line-soft bg-paper px-5 py-5">
          <p className="font-serif-jp text-sm leading-[1.9] text-muted">
            口コミの投稿にはログインが必要です。
          </p>
          <Link
            href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
          >
            ログインへ
          </Link>
        </div>
      )}

      {deleteError && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {deleteError}
        </p>
      )}

      {comments.length === 0 ? (
        <p className="border border-line-soft bg-paper px-5 py-6 text-center font-serif-jp text-sm text-muted">
          まだ口コミはありません。
        </p>
      ) : (
        <ul className="divide-y divide-line-soft border border-line-soft bg-paper">
          {comments.map((comment) => (
            <li key={comment.id} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mincho text-sm text-ink">
                  {comment.user?.name ?? "匿名ユーザー"}
                </span>
                <span className="font-sans-jp text-[10px] tracking-[0.15em] text-muted">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-serif-jp text-sm leading-[1.9] text-ink">
                {comment.body}
              </p>
              {comment.owned_by_current_user && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleting}
                    className="inline-flex items-center gap-1 border border-line px-2.5 py-1 font-sans-jp text-[10px] tracking-[0.1em] text-muted transition-colors hover:border-bengara hover:text-bengara disabled:opacity-60"
                  >
                    <HiTrash className="h-3 w-3" aria-hidden="true" />
                    削除
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

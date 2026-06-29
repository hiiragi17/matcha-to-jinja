"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import { HiTrash } from "react-icons/hi2";
import { ApiError, isForbidden, isUnauthorized } from "@/lib/api";
import {
  adminDeleteGreenteaComment,
  adminDeleteTempleComment,
  listAdminComments,
} from "@/lib/api/admin/comments";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { AdminComment, AdminCommentListResponse } from "@/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const CALLBACK_URL = "/admin/comments";
type SwrKey = readonly [string, string];

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

function resourceHref(comment: AdminComment): string {
  return comment.resource_type === "greentea"
    ? `/greenteas/${comment.resource_id}`
    : `/temples/${comment.resource_id}`;
}

export default function CommentModerationList() {
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler(CALLBACK_URL);
  const [target, setTarget] = useState<AdminComment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  // フェッチャーは SWR キーからトークンを取り出す（クロージャ越しの authToken に
  // 依存するとキャッシュ無効化のタイミングがずれるため）。
  const fetcher = ([, token]: SwrKey): Promise<AdminCommentListResponse> =>
    listAdminComments(token);

  const { data, error, isLoading, mutate } = useSWR<
    AdminCommentListResponse,
    ApiError,
    SwrKey | null
  >(authToken ? (["/admin/comments", authToken] as const) : null, fetcher);

  // 一覧取得時の 401（セッション切れ）はレンダー中に処理できないため effect で。
  const sessionExpired = !!error && isUnauthorized(error);
  useEffect(() => {
    if (sessionExpired) {
      void handleSessionExpired();
    }
  }, [sessionExpired, handleSessionExpired]);

  const handleConfirm = () => {
    if (!target) return;
    const comment = target;
    setDeleteError(null);
    startDelete(async () => {
      if (!authToken) {
        await handleSessionExpired();
        return;
      }
      try {
        if (comment.resource_type === "greentea") {
          await adminDeleteGreenteaComment(comment.id, authToken);
        } else {
          await adminDeleteTempleComment(comment.id, authToken);
        }
        setTarget(null);
        // 楽観的更新はせず、削除後に再取得して一覧を確定させる。
        await mutate();
      } catch (e) {
        if (isUnauthorized(e)) {
          await handleSessionExpired();
          return;
        }
        if (isForbidden(e)) {
          setDeleteError("このコメントを削除する権限がありません。");
          return;
        }
        setDeleteError("削除に失敗しました。時間を置いてお試しください。");
      }
    });
  };

  if (!authToken) {
    return (
      <div className="border border-line-soft bg-paper px-5 py-6">
        <p className="font-serif-jp text-sm leading-[1.9] text-muted">
          コメント管理の表示にはログインが必要です。
        </p>
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(CALLBACK_URL)}`}
          className="mt-3 inline-block border border-olive px-4 py-1.5 font-mincho text-[13px] tracking-[0.12em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        読み込み中…
      </p>
    );
  }

  if (error) {
    const msg = isUnauthorized(error)
      ? "ログインの有効期限が切れました。再度ログインしてください。"
      : "コメントの取得に失敗しました。時間を置いてお試しください。";
    return (
      <p role="alert" className="font-sans-jp text-xs text-bengara">
        {msg}
      </p>
    );
  }

  const comments = data?.comments ?? [];

  if (comments.length === 0) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-8 text-center font-serif-jp text-sm text-muted">
        コメントがありません。
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border border-line">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line bg-washi text-left">
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                対象
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                投稿者
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                本文
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                投稿日
              </th>
              <th className="px-4 py-2.5 text-right font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr
                key={`${comment.resource_type}-${comment.id}`}
                className="border-b border-line-soft last:border-0 align-top"
              >
                <td className="px-4 py-3">
                  <span className="mb-1 inline-block border border-line px-2 py-0.5 font-sans-jp text-[10px] tracking-[0.1em] text-muted">
                    {comment.resource_type === "greentea" ? "抹茶店" : "神社・仏閣"}
                  </span>
                  <Link
                    href={resourceHref(comment)}
                    className="block font-mincho text-sm text-ink transition-colors hover:text-olive"
                  >
                    {comment.resource_name || `#${comment.resource_id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 font-serif-jp text-xs text-muted">
                  {comment.user.name}
                </td>
                <td className="px-4 py-3 font-serif-jp text-sm leading-[1.8] text-ink">
                  <span className="block max-w-md whitespace-pre-wrap break-words">
                    {comment.body}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-sans-jp text-xs text-muted">
                  {formatDate(comment.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setTarget(comment);
                      }}
                      className="inline-flex items-center gap-1 border border-line px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-muted transition-colors hover:border-bengara hover:text-bengara"
                    >
                      <HiTrash className="h-3.5 w-3.5" aria-hidden="true" />
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        open={target !== null}
        title="コメントを削除"
        message={
          target
            ? `「${target.resource_name || `#${target.resource_id}`}」への ${target.user.name} さんのコメントを削除します。この操作は取り消せません。`
            : ""
        }
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!deleting) {
            setTarget(null);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HiPencilSquare, HiTrash } from "react-icons/hi2";
import { deleteGreentea } from "@/lib/api/admin/greenteas";
import { isUnauthorized } from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { Greentea } from "@/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

type GreenteaAdminTableProps = {
  greenteas: Greentea[];
};

export default function GreenteaAdminTable({
  greenteas,
}: GreenteaAdminTableProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler("/admin/greenteas");
  const [target, setTarget] = useState<Greentea | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  const handleConfirm = () => {
    if (!target) return;
    const id = target.id;
    setDeleteError(null);
    startDelete(async () => {
      if (!authToken) {
        await handleSessionExpired();
        return;
      }
      try {
        await deleteGreentea(id, authToken);
        setTarget(null);
        router.refresh();
      } catch (e) {
        if (isUnauthorized(e)) {
          await handleSessionExpired();
          return;
        }
        setDeleteError("削除に失敗しました。時間を置いてお試しください。");
      }
    });
  };

  if (greenteas.length === 0) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-8 text-center font-serif-jp text-sm text-muted">
        登録された抹茶店がありません。
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
                店名
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                住所
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                ジャンル
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                状態
              </th>
              <th className="px-4 py-2.5 text-right font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {greenteas.map((g) => (
              <tr key={g.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-mincho text-sm text-ink">
                  {g.name}
                </td>
                <td className="px-4 py-3 font-serif-jp text-xs text-muted">
                  {g.address}
                </td>
                <td className="px-4 py-3 font-serif-jp text-xs text-muted">
                  {g.genres.map((genre) => genre.name).join(" / ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {g.closed ? (
                    <span className="border border-bengara px-2 py-0.5 font-sans-jp text-[10px] tracking-[0.1em] text-bengara">
                      閉店
                    </span>
                  ) : (
                    <span className="border border-line px-2 py-0.5 font-sans-jp text-[10px] tracking-[0.1em] text-muted">
                      営業中
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/greenteas/${g.id}/edit`}
                      className="inline-flex items-center gap-1 border border-line px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-ink transition-colors hover:border-olive hover:text-olive"
                    >
                      <HiPencilSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setTarget(g);
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
        title="抹茶店を削除"
        message={
          target
            ? `「${target.name}」を削除します。この操作は取り消せません。`
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

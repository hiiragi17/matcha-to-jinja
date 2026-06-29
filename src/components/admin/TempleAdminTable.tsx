"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HiPencilSquare, HiTrash } from "react-icons/hi2";
import { deleteTemple } from "@/lib/api/admin/temples";
import { isUnauthorized } from "@/lib/api";
import { useAuthToken } from "@/lib/api/useAuthToken";
import { useSessionExpiredHandler } from "@/lib/api/useSessionExpired";
import type { Temple } from "@/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

type TempleAdminTableProps = {
  temples: Temple[];
};

export default function TempleAdminTable({ temples }: TempleAdminTableProps) {
  const router = useRouter();
  const authToken = useAuthToken();
  const handleSessionExpired = useSessionExpiredHandler("/admin/temples");
  const [target, setTarget] = useState<Temple | null>(null);
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
        await deleteTemple(id, authToken);
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

  if (temples.length === 0) {
    return (
      <p className="border border-line-soft bg-paper px-5 py-8 text-center font-serif-jp text-sm text-muted">
        登録された神社・仏閣がありません。
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
                神社名
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                住所
              </th>
              <th className="px-4 py-2.5 font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                エリア
              </th>
              <th className="px-4 py-2.5 text-right font-sans-jp text-[11px] tracking-[0.1em] text-muted">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {temples.map((t) => (
              <tr key={t.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-mincho text-sm text-ink">
                  {t.name}
                </td>
                <td className="px-4 py-3 font-serif-jp text-xs text-muted">
                  {t.address}
                </td>
                <td className="px-4 py-3 font-serif-jp text-xs text-muted">
                  {t.areas.map((area) => area.name).join(" / ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/temples/${t.id}/edit`}
                      className="inline-flex items-center gap-1 border border-line px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-ink transition-colors hover:border-olive hover:text-olive"
                    >
                      <HiPencilSquare className="h-3.5 w-3.5" aria-hidden="true" />
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setTarget(t);
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
        title="神社・仏閣を削除"
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

import Link from "next/link";
import { notFound } from "next/navigation";
import TempleForm from "@/components/admin/TempleForm";
import { getAreas, getTemple } from "@/lib/api";
import { getErrorStatus } from "@/lib/api";

export default async function EditTemplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templeId = Number(id);
  if (!Number.isInteger(templeId) || templeId <= 0) {
    notFound();
  }

  const [templeResult, { areas }] = await Promise.all([
    getTemple(templeId).catch((e: unknown) => {
      if (getErrorStatus(e) === 404) return null;
      throw e;
    }),
    getAreas(),
  ]);

  if (!templeResult) notFound();
  const { temple } = templeResult;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/temples"
          className="font-sans-jp text-xs tracking-[0.1em] text-muted hover:text-olive"
        >
          ← 神社・仏閣の管理へ戻る
        </Link>
        <h1 className="mt-2 font-mincho text-xl tracking-[0.1em] text-ink">
          神社・仏閣を編集
        </h1>
      </div>
      <TempleForm areas={areas} mode="edit" initial={temple} />
    </div>
  );
}

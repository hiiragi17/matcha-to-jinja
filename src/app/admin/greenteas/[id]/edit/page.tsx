import Link from "next/link";
import { notFound } from "next/navigation";
import GreenteaForm from "@/components/admin/GreenteaForm";
import { getGenres, getGreentea } from "@/lib/api";
import { getErrorStatus } from "@/lib/api";

export default async function EditGreenteaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [greenteaResult, { genres }] = await Promise.all([
    getGreentea(id).catch((e: unknown) => {
      if (getErrorStatus(e) === 404) return null;
      throw e;
    }),
    getGenres(),
  ]);

  if (!greenteaResult) notFound();
  const { greentea } = greenteaResult;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/greenteas"
          className="font-sans-jp text-xs tracking-[0.1em] text-muted hover:text-olive"
        >
          ← 抹茶店の管理へ戻る
        </Link>
        <h1 className="mt-2 font-mincho text-xl tracking-[0.1em] text-ink">
          抹茶店を編集
        </h1>
      </div>
      <GreenteaForm genres={genres} mode="edit" initial={greentea} />
    </div>
  );
}

import Link from "next/link";
import TempleForm from "@/components/admin/TempleForm";
import { getAreas } from "@/lib/api";

export default async function NewTemplePage() {
  const { areas } = await getAreas();

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
          神社・仏閣を新規作成
        </h1>
      </div>
      <TempleForm areas={areas} mode="create" />
    </div>
  );
}

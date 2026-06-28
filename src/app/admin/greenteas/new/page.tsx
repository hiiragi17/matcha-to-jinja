import Link from "next/link";
import GreenteaForm from "@/components/admin/GreenteaForm";
import { getGenres } from "@/lib/api";

export default async function NewGreenteaPage() {
  const { genres } = await getGenres();

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
          抹茶店を新規作成
        </h1>
      </div>
      <GreenteaForm genres={genres} mode="create" />
    </div>
  );
}

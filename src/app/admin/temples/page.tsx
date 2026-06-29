import Link from "next/link";
import { redirect } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import Pagination from "@/components/common/Pagination";
import TempleAdminTable from "@/components/admin/TempleAdminTable";
import { getTemples } from "@/lib/api";

type SearchParams = { page?: string };

export default async function AdminTemplesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const parsedPage = Number.parseInt(sp.page ?? "", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { temples, meta } = await getTemples({ page });

  // 範囲外の page= は最終ページへ寄せる（公開一覧と同じガード）。
  if (meta.total_pages > 0 && page > meta.total_pages) {
    redirect(
      meta.total_pages > 1
        ? `/admin/temples?page=${meta.total_pages}`
        : "/admin/temples",
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mincho text-xl tracking-[0.1em] text-ink">
            神社・仏閣の管理
          </h1>
          <p className="mt-1 font-sans-jp text-xs tracking-[0.1em] text-muted">
            全 {meta.total_count} 件
            {meta.total_pages > 1 &&
              ` ( ${meta.current_page} / ${meta.total_pages} ページ )`}
          </p>
        </div>
        <Link
          href="/admin/temples/new"
          className="inline-flex items-center gap-1.5 border border-olive bg-olive px-4 py-2 font-mincho text-[13px] tracking-[0.12em] text-paper transition-colors hover:bg-olive-dark"
        >
          <HiPlus className="h-4 w-4" aria-hidden="true" />
          新規作成
        </Link>
      </div>

      <TempleAdminTable temples={temples} />

      <div className="mt-8">
        <Pagination
          basePath="/admin/temples"
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          preservedQuery=""
        />
      </div>
    </div>
  );
}

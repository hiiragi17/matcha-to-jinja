import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Hairline from "@/components/brand/Hairline";
import Pagination from "@/components/common/Pagination";
import TempleList from "@/components/temple/TempleList";
import TempleSearchForm from "@/components/temple/TempleSearchForm";
import { getAreas, getTemples } from "@/lib/api";

export const metadata: Metadata = {
  title: "神社",
  description:
    "京都の神社仏閣を一覧で探せます。名称・エリアで絞り込み可能。",
};

type SearchParams = {
  q?: string;
  area?: string;
  page?: string;
};

function buildPreservedQuery(params: SearchParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.area) search.set("area", params.area);
  return search.toString();
}

export default async function TemplesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  // area は 0 が有効 ID の可能性に備えて Number.isFinite で判定する。
  // 空文字列は Number("") === 0 として誤判定されるため除外する。
  const areaIdNum =
    sp.area !== undefined && sp.area !== "" ? Number(sp.area) : undefined;
  const areaId =
    areaIdNum !== undefined && Number.isFinite(areaIdNum)
      ? areaIdNum
      : undefined;

  const [{ temples, meta }, { areas }] = await Promise.all([
    getTemples({
      page,
      q: { name_cont: sp.q, areas_id_eq: areaId },
    }),
    getAreas(),
  ]);

  const preservedQuery = buildPreservedQuery(sp);

  // 範囲外の page= が指定された場合は最終ページへ寄せる（モック実装でも空配列を防ぐ）。
  // total_pages が 0 のときは redirect ループを防ぐためガードする。
  if (meta.total_pages > 0 && page > meta.total_pages) {
    const params = new URLSearchParams(preservedQuery);
    if (meta.total_pages > 1) params.set("page", String(meta.total_pages));
    const query = params.toString();
    redirect(query ? `/temples?${query}` : "/temples");
  }

  const selectedArea = areas.find((a) => a.id === areaId);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-12">
      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-bengara">
          神社仏閣 / SHRINES &amp; TEMPLES
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.08em] text-ink">
          神社仏閣をさがす
        </h1>
        <Hairline width={40} className="mt-5" />
        <p className="mt-5 max-w-xl font-serif-jp text-sm leading-[2] text-muted">
          京都の神社・お寺を一覧でご紹介します。
        </p>
      </header>

      <div className="mt-10">
        <TempleSearchForm areas={areas} />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-3">
        <p className="font-mincho text-sm text-ink">
          {meta.total_count > 0 ? (
            <>
              全 <span className="font-semibold">{meta.total_count}</span> 件
              {meta.total_pages > 1 && (
                <span className="ml-2 font-sans-jp text-xs text-muted">
                  ( {meta.current_page} / {meta.total_pages} ページ )
                </span>
              )}
            </>
          ) : (
            "該当なし"
          )}
        </p>
        {(sp.q || selectedArea) && (
          <p className="font-sans-jp text-xs tracking-[0.1em] text-muted">
            {sp.q && <>キーワード: 「{sp.q}」</>}
            {sp.q && selectedArea && " / "}
            {selectedArea && <>エリア: {selectedArea.name}</>}
          </p>
        )}
      </div>

      <div className="mt-6">
        <TempleList temples={temples} />
      </div>

      <div className="mt-10">
        <Pagination
          basePath="/temples"
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          preservedQuery={preservedQuery}
        />
      </div>
    </section>
  );
}

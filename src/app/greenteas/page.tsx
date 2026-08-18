import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Hairline from "@/components/brand/Hairline";
import Pagination from "@/components/common/Pagination";
import GreenteaList from "@/components/greentea/GreenteaList";
import GreenteaSearchForm from "@/components/greentea/GreenteaSearchForm";
import { getGenres, getGreenteas } from "@/lib/api";

export const metadata: Metadata = {
  title: "抹茶店",
  description:
    "京都の抹茶スイーツ店を一覧で探せます。店名・ジャンルで絞り込み可能。",
};

type SearchParams = {
  q?: string;
  genre?: string | string[];
  page?: string;
};

function normalizeIds(value: string | string[] | undefined): number[] {
  const values = value === undefined ? [] : Array.isArray(value) ? value : [value];
  return values
    .map((v) => Number(v))
    .filter((n, i, arr) => Number.isFinite(n) && arr.indexOf(n) === i);
}

function buildPreservedQuery(params: SearchParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  for (const id of normalizeIds(params.genre)) search.append("genre", String(id));
  return search.toString();
}

export default async function GreenteasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const genreIds = normalizeIds(sp.genre);

  const [{ greenteas, meta }, { genres }] = await Promise.all([
    getGreenteas({
      page,
      q: {
        name_cont: sp.q,
        greentea_genres_genre_id_eq_any: genreIds.length > 0 ? genreIds : undefined,
      },
    }),
    getGenres(),
  ]);

  const preservedQuery = buildPreservedQuery(sp);

  // 範囲外の page= が指定された場合は最終ページへ寄せる（モック実装でも空配列を防ぐ）。
  // total_pages が 0 のときは redirect ループを防ぐためガードする。
  if (meta.total_pages > 0 && page > meta.total_pages) {
    const params = new URLSearchParams(preservedQuery);
    if (meta.total_pages > 1) params.set("page", String(meta.total_pages));
    const query = params.toString();
    redirect(query ? `/greenteas?${query}` : "/greenteas");
  }

  const selectedGenres = genres.filter((g) => genreIds.includes(g.id));

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12 md:px-12">
      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          抹茶スイーツ / MATCHA SWEETS
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.08em] text-ink">
          抹茶店をさがす
        </h1>
        <Hairline width={40} className="mt-5" />
        <p className="mt-5 max-w-xl font-serif-jp text-sm leading-[2] text-muted">
          京都の抹茶スイーツが楽しめるお店を一覧でご紹介します。
        </p>
      </header>

      <div className="mt-10">
        <GreenteaSearchForm genres={genres} />
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
        {(sp.q || selectedGenres.length > 0) && (
          <p className="font-sans-jp text-xs tracking-[0.1em] text-muted">
            {sp.q && <>キーワード: 「{sp.q}」</>}
            {sp.q && selectedGenres.length > 0 && " / "}
            {selectedGenres.length > 0 && (
              <>ジャンル: {selectedGenres.map((g) => g.name).join("、")}</>
            )}
          </p>
        )}
      </div>

      <div className="mt-6">
        <GreenteaList greenteas={greenteas} />
      </div>

      <div className="mt-10">
        <Pagination
          basePath="/greenteas"
          currentPage={meta.current_page}
          totalPages={meta.total_pages}
          preservedQuery={preservedQuery}
        />
      </div>
    </section>
  );
}

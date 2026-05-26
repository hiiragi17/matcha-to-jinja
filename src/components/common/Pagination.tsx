import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  // 現在のクエリ文字列（page 以外）。URLSearchParams 形式の文字列を期待。
  preservedQuery?: string;
};

const PAGE_WINDOW = 2;

function buildPageRange(current: number, total: number): number[] {
  if (total <= 1) return [1];
  const start = Math.max(1, current - PAGE_WINDOW);
  const end = Math.min(total, current + PAGE_WINDOW);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export default function Pagination({
  basePath,
  currentPage,
  totalPages,
  preservedQuery,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(preservedQuery ?? "");
    params.delete("page");
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  const pages = buildPageRange(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const baseLink =
    "inline-flex h-9 min-w-9 items-center justify-center border border-line bg-paper px-3 font-sans-jp text-[13px] text-ink transition-colors hover:bg-washi-bg";
  const disabledLink =
    "inline-flex h-9 min-w-9 items-center justify-center border border-line-soft bg-washi px-3 font-sans-jp text-[13px] text-muted/60";
  const activeLink =
    "inline-flex h-9 min-w-9 items-center justify-center border border-olive bg-olive px-3 font-sans-jp text-[13px] text-paper";

  return (
    <nav
      aria-label="ページネーション"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {hasPrev ? (
        <Link href={hrefFor(currentPage - 1)} className={baseLink} rel="prev">
          ‹ 前へ
        </Link>
      ) : (
        <span className={disabledLink} aria-hidden="true">
          ‹ 前へ
        </span>
      )}

      {pages[0] > 1 && (
        <>
          <Link href={hrefFor(1)} className={baseLink}>
            1
          </Link>
          {pages[0] > 2 && (
            <span className="px-1 font-sans-jp text-[13px] text-muted">…</span>
          )}
        </>
      )}

      {pages.map((page) =>
        page === currentPage ? (
          <span key={page} aria-current="page" className={activeLink}>
            {page}
          </span>
        ) : (
          <Link key={page} href={hrefFor(page)} className={baseLink}>
            {page}
          </Link>
        ),
      )}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 font-sans-jp text-[13px] text-muted">…</span>
          )}
          <Link href={hrefFor(totalPages)} className={baseLink}>
            {totalPages}
          </Link>
        </>
      )}

      {hasNext ? (
        <Link href={hrefFor(currentPage + 1)} className={baseLink} rel="next">
          次へ ›
        </Link>
      ) : (
        <span className={disabledLink} aria-hidden="true">
          次へ ›
        </span>
      )}
    </nav>
  );
}

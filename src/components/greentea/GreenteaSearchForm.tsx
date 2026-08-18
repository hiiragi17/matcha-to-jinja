"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Genre } from "@/types";

type GreenteaSearchFormProps = {
  genres: Genre[];
};

function parseGenreIds(searchParams: URLSearchParams): number[] {
  return searchParams
    .getAll("genre")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

export default function GreenteaSearchForm({ genres }: GreenteaSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const queryFromUrl = searchParams.get("q") ?? "";
  const genreIdsFromUrl = parseGenreIds(searchParams);

  const [keyword, setKeyword] = useState(queryFromUrl);
  const [genreIds, setGenreIds] = useState<number[]>(genreIdsFromUrl);

  // ブラウザの戻る/進むや外部リンクで URL が変わったとき、フォーム値を URL に追従させる。
  // 依存配列は searchParams の中身（文字列化）にする。オブジェクト参照はレンダーの
  // たびに変わりうる（Next.js の実装やテスト用モックの都合）ため、参照比較だと
  // 無限ループになりうる。
  const searchParamsKey = searchParams.toString();
  useEffect(() => {
    setKeyword(searchParams.get("q") ?? "");
    setGenreIds(parseGenreIds(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsKey]);

  const toggleGenre = (id: number) => {
    setGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    for (const id of genreIds) params.append("genre", String(id));
    // 検索条件変更時は 1 ページ目に戻る
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/greenteas?${query}` : "/greenteas");
    });
  };

  const clear = () => {
    setKeyword("");
    setGenreIds([]);
    startTransition(() => {
      router.push("/greenteas");
    });
  };

  const hasFilter = Boolean(searchParams.get("q") || searchParams.getAll("genre").length > 0);

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 border border-line bg-paper p-4 sm:flex-row sm:items-end"
    >
      <label className="flex flex-1 flex-col gap-1.5">
        <span className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
          キーワード / KEYWORD
        </span>
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="キーワードで検索"
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
          ジャンル / GENRE（複数選択可）
        </legend>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const checked = genreIds.includes(genre.id);
            return (
              <label
                key={genre.id}
                className={`flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 transition-colors ${
                  checked
                    ? "border-olive bg-olive text-paper"
                    : "border-line bg-washi text-ink"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGenre(genre.id)}
                  className="h-3.5 w-3.5 accent-olive"
                />
                <span className="font-serif-jp text-sm">{genre.name}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-2 sm:flex-shrink-0">
        <button
          type="submit"
          disabled={isPending}
          className="h-10 border border-olive bg-olive px-5 font-mincho text-[13px] tracking-[0.15em] text-paper transition-colors hover:bg-olive-dark disabled:opacity-60"
        >
          検索
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className="h-10 border border-line bg-paper px-4 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-washi-bg disabled:opacity-60"
          >
            クリア
          </button>
        )}
      </div>
    </form>
  );
}

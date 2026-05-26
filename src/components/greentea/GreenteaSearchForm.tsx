"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Genre } from "@/types";

type GreenteaSearchFormProps = {
  genres: Genre[];
};

export default function GreenteaSearchForm({ genres }: GreenteaSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [genreId, setGenreId] = useState(searchParams.get("genre") ?? "");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (genreId) params.set("genre", genreId);
    // 検索条件変更時は 1 ページ目に戻る
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/greenteas?${query}` : "/greenteas");
    });
  };

  const clear = () => {
    setKeyword("");
    setGenreId("");
    startTransition(() => {
      router.push("/greenteas");
    });
  };

  const hasFilter = Boolean(searchParams.get("q") || searchParams.get("genre"));

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
          placeholder="店名で探す"
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 sm:w-48">
        <span className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
          ジャンル / GENRE
        </span>
        <select
          value={genreId}
          onChange={(e) => setGenreId(e.target.value)}
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink focus:border-olive focus:outline-none"
        >
          <option value="">すべて</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>

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

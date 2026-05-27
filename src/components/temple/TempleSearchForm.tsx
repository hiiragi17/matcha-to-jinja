"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Area } from "@/types";

type TempleSearchFormProps = {
  areas: Area[];
};

export default function TempleSearchForm({ areas }: TempleSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const queryFromUrl = searchParams.get("q") ?? "";
  const areaFromUrl = searchParams.get("area") ?? "";

  const [keyword, setKeyword] = useState(queryFromUrl);
  const [areaId, setAreaId] = useState(areaFromUrl);

  // ブラウザの戻る/進むや外部リンクで URL が変わったとき、フォーム値を URL に追従させる。
  useEffect(() => {
    setKeyword(queryFromUrl);
    setAreaId(areaFromUrl);
  }, [queryFromUrl, areaFromUrl]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (areaId) params.set("area", areaId);
    // 検索条件変更時は 1 ページ目に戻る
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/temples?${query}` : "/temples");
    });
  };

  const clear = () => {
    setKeyword("");
    setAreaId("");
    startTransition(() => {
      router.push("/temples");
    });
  };

  const hasFilter = Boolean(searchParams.get("q") || searchParams.get("area"));

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
          placeholder="神社名で探す"
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 sm:w-48">
        <span className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
          エリア / AREA
        </span>
        <select
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink focus:border-olive focus:outline-none"
        >
          <option value="">すべて</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
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

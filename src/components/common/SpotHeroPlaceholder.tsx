import type { ReactNode } from "react";
import { latticeBackgroundStyle } from "./latticePattern";

type Tag = { id: number; name: string };

type SpotHeroPlaceholderProps = {
  name: string;
  tags: Tag[];
  icon: ReactNode;
};

// 画像未登録時の詳細ページヒーロー。緑地格子柄の上に店名/社寺名・タグ・アイコンを重ねる。
export default function SpotHeroPlaceholder({
  name,
  tags,
  icon,
}: SpotHeroPlaceholderProps) {
  return (
    <div
      className="relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden bg-matcha-dark p-5 sm:p-8"
      style={latticeBackgroundStyle}
    >
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="border border-paper/30 bg-paper/10 px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-paper/90"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between gap-4">
        <p className="font-mincho text-3xl font-semibold leading-tight text-paper/95 sm:text-4xl">
          {name}
        </p>
        <span className="shrink-0 opacity-60">{icon}</span>
      </div>
    </div>
  );
}

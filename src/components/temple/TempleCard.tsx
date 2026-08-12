import Link from "next/link";
import { HiHeart } from "react-icons/hi2";
import { hasImage } from "@/lib/utils/image";
import { ToriiIcon } from "@/components/brand/icons";
import type { Temple } from "@/types";

type TempleCardProps = {
  temple: Temple;
};

export default function TempleCard({ temple }: TempleCardProps) {
  return (
    <Link
      href={`/temples/${temple.id}`}
      className="flex h-full flex-col border border-line-soft bg-paper transition-colors hover:bg-washi-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bengara"
    >
      {/* 画像の有無でカードの見た目が崩れないよう、枠は常に確保する（未登録時はプレースホルダー）。 */}
      <figure className="aspect-[4/3] overflow-hidden border-b border-line-soft">
        {hasImage(temple.img) ? (
          // 画像は Rails(CarrierWave)/外部 URL をそのまま表示するため next/image を使わない
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={temple.img}
            alt={temple.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-washi">
            <ToriiIcon size={36} />
          </div>
        )}
      </figure>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-mincho text-lg font-semibold tracking-[0.04em] text-ink">
          {temple.name}
        </h3>
        <p className="line-clamp-2 font-serif-jp text-sm leading-[1.9] text-muted">
          {temple.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {temple.areas.map((area) => (
            <span
              key={area.id}
              className="border border-line bg-washi px-2 py-0.5 font-sans-jp text-[10px] text-olive"
            >
              {area.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 font-sans-jp text-sm text-muted">
            <HiHeart className="h-4 w-4 text-bengara" aria-hidden="true" />
            {temple.likes_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

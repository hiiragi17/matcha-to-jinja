import Link from "next/link";
import { HiHeart } from "react-icons/hi2";
import { hasImage } from "@/lib/utils/image";
import { ChawanIcon } from "@/components/brand/icons";
import SpotPlaceholder from "../common/SpotPlaceholder";
import type { Greentea } from "@/types";

type GreenteaCardProps = {
  greentea: Greentea;
};

export default function GreenteaCard({ greentea }: GreenteaCardProps) {
  return (
    <Link
      href={`/greenteas/${greentea.id}`}
      className="flex h-full flex-col border border-line-soft bg-paper transition-colors hover:bg-washi-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bengara"
    >
      {/* 画像の有無でカードの見た目が崩れないよう、枠は常に確保する（未登録時はプレースホルダー）。 */}
      <figure className="aspect-[4/3] overflow-hidden border-b border-line">
        {hasImage(greentea.img) ? (
          // 画像は Rails(CarrierWave)/外部 URL をそのまま表示するため next/image を使わない
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={greentea.img}
            alt={greentea.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <SpotPlaceholder
            name={greentea.name}
            icon={<ChawanIcon size={20} color="#fbf6e5" />}
          />
        )}
      </figure>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-mincho text-lg font-semibold tracking-[0.04em] text-ink">
          {greentea.name}
        </h3>
        <dl className="flex flex-col gap-1 font-sans-jp text-xs leading-relaxed text-muted">
          <div className="flex gap-1.5">
            <dt className="shrink-0 text-olive">住所</dt>
            <dd className="line-clamp-1">{greentea.address}</dd>
          </div>
          {greentea.access && (
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-olive">アクセス</dt>
              <dd className="line-clamp-1">{greentea.access}</dd>
            </div>
          )}
          <div className="flex gap-1.5">
            <dt className="shrink-0 text-olive">定休日</dt>
            <dd className="line-clamp-1">{greentea.holiday}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {greentea.genres.map((genre) => (
            <span
              key={genre.id}
              className="border border-line bg-washi px-2 py-0.5 font-sans-jp text-[10px] text-olive"
            >
              {genre.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 font-sans-jp text-sm text-muted">
            <HiHeart className="h-4 w-4 text-bengara" aria-hidden="true" />
            {greentea.likes_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

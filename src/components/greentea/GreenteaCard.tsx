import Link from "next/link";
import { HiHeart } from "react-icons/hi2";
import { imageSrcOrPlaceholder } from "@/lib/utils/image";
import type { Greentea } from "@/types";

type GreenteaCardProps = {
  greentea: Greentea;
};

export default function GreenteaCard({ greentea }: GreenteaCardProps) {
  return (
    <Link
      href={`/greenteas/${greentea.id}`}
      className="block border border-line-soft bg-paper transition-colors hover:bg-washi-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bengara"
    >
      <figure className="aspect-[4/3] overflow-hidden border-b border-line-soft">
        {/* 画像は Rails(CarrierWave)/外部 URL をそのまま表示するため next/image を使わない */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrcOrPlaceholder(greentea.img)}
          alt={greentea.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-mincho text-lg font-semibold tracking-[0.04em] text-ink">
          {greentea.name}
        </h3>
        <p className="line-clamp-2 font-serif-jp text-sm leading-[1.9] text-muted">
          {greentea.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
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

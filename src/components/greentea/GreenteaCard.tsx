import Link from "next/link";
import { HiHeart } from "react-icons/hi2";
import type { Greentea } from "@/types";

type GreenteaCardProps = {
  greentea: Greentea;
};

export default function GreenteaCard({ greentea }: GreenteaCardProps) {
  return (
    <Link
      href={`/greenteas/${greentea.id}`}
      className="card bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <figure className="aspect-[4/3] overflow-hidden">
        {/* 画像は Rails(CarrierWave)/外部 URL をそのまま表示するため next/image を使わない */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={greentea.img}
          alt={greentea.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="card-body gap-2 p-4">
        <h3 className="card-title text-lg">{greentea.name}</h3>
        <p className="line-clamp-2 text-sm text-base-content/70">
          {greentea.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {greentea.genres.map((genre) => (
            <span key={genre.id} className="badge badge-primary badge-sm">
              {genre.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-sm text-base-content/60">
            <HiHeart className="h-4 w-4 text-secondary" aria-hidden="true" />
            {greentea.likes_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { HiHeart } from "react-icons/hi2";
import type { Temple } from "@/types";

type TempleCardProps = {
  temple: Temple;
};

export default function TempleCard({ temple }: TempleCardProps) {
  return (
    <Link
      href={`/temples/${temple.id}`}
      className="card bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    >
      <figure className="aspect-[4/3] overflow-hidden">
        {/* 画像は Rails(CarrierWave)/外部 URL をそのまま表示するため next/image を使わない */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={temple.img}
          alt={temple.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </figure>
      <div className="card-body gap-2 p-4">
        <h3 className="card-title text-lg">{temple.name}</h3>
        <p className="line-clamp-2 text-sm text-base-content/70">
          {temple.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {temple.areas.map((area) => (
            <span key={area.id} className="badge badge-secondary badge-sm">
              {area.name}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-sm text-base-content/60">
            <HiHeart className="h-4 w-4 text-secondary" aria-hidden="true" />
            {temple.likes_count}
          </span>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { ChawanIcon, ToriiIcon } from "../brand/icons";
import type { NearbySpot } from "@/types";

type SpotKind = "greentea" | "temple";

type NearbySpotsListProps = {
  // 詳細ページ本体で既に取得済みの周辺スポット（再フェッチしない）。距離昇順は API 側の並びに従う。
  spots: NearbySpot[];
  kind: SpotKind;
};

const KIND_CONFIG = {
  greentea: { href: "/greenteas", Icon: ChawanIcon, color: "#608060" },
  temple: { href: "/temples", Icon: ToriiIcon, color: "#905050" },
} as const;

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// 地図の下に添える周辺スポット一覧。地図のマーカーは枠外だと気づきにくいため、
// クリック不要で距離とリンクを確認できるようテキスト一覧としても表示する。
export default function NearbySpotsList({ spots, kind }: NearbySpotsListProps) {
  if (spots.length === 0) return null;

  const { href, Icon, color } = KIND_CONFIG[kind];

  return (
    <ul className="mt-4 divide-y divide-line-soft border border-line-soft bg-paper">
      {spots.map((spot) => (
        <li key={spot.id}>
          <Link
            href={`${href}/${spot.id}`}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-washi-bg"
          >
            <Icon size={22} color={color} />
            <span className="flex-1 font-mincho text-base text-ink">
              {spot.name}
            </span>
            <span className="font-sans-jp text-xs tracking-[0.1em] text-muted">
              {formatDistance(spot.distance_meters)}
            </span>
            <span aria-hidden="true" className="font-mincho text-base text-muted">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

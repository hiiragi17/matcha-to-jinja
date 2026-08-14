import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiArrowLeft } from "react-icons/hi2";
import { ChawanIcon } from "@/components/brand/icons";
import Hairline from "@/components/brand/Hairline";
import CommentSection from "@/components/common/CommentSection";
import LikeButton from "@/components/common/LikeButton";
import ShareButtons from "@/components/common/ShareButtons";
import SpotHeroPlaceholder from "@/components/common/SpotHeroPlaceholder";
import NearbySpotsList from "@/components/map/NearbySpotsList";
import NearbySpotsMap from "@/components/map/NearbySpotsMap";
import { ApiError, getGreentea } from "@/lib/api";
import { auth } from "@/lib/auth";
import { hasImage } from "@/lib/utils/image";
import { buildSpotMetadata } from "@/lib/utils/metadata";
import type { GreenteaDetail } from "@/types";

type RouteParams = { id: string };

async function fetchGreentea(
  id: string,
  authToken?: string,
): Promise<GreenteaDetail> {
  try {
    const { greentea } = await getGreentea(id, authToken);
    return greentea;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<RouteParams> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;
  try {
    const { greentea } = await getGreentea(id);
    return await buildSpotMetadata(greentea.name, greentea.description, parent);
  } catch {
    return { title: "抹茶店の詳細" };
  }
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7em_1fr] gap-3 border-b border-line-soft py-3 last:border-b-0 sm:grid-cols-[8em_1fr]">
      <dt className="font-sans-jp text-[11px] tracking-[0.2em] text-olive">
        {label}
      </dt>
      <dd className="font-serif-jp text-sm leading-[1.9] text-ink">{children}</dd>
    </div>
  );
}

export default async function GreenteaDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const session = await auth();
  const greentea = await fetchGreentea(id, session?.railsJwt);

  return (
    <article className="mx-auto w-full max-w-5xl px-6 py-12 md:px-12">
      <div className="mb-6">
        <Link
          href="/greenteas"
          className="inline-flex items-center gap-2 font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          <HiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          抹茶店一覧へ
        </Link>
      </div>

      <figure className="overflow-hidden border border-line-soft bg-paper">
        {hasImage(greentea.img) ? (
          <div className="aspect-[16/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={greentea.img}
              alt={greentea.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <SpotHeroPlaceholder
            name={greentea.name}
            tags={greentea.genres}
            icon={<ChawanIcon size={28} color="#fbf6e5" />}
          />
        )}
      </figure>

      <header className="mt-10 flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          抹茶スイーツ / MATCHA SWEETS
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.06em] text-ink sm:text-4xl">
          {greentea.name}
        </h1>
        <Hairline width={40} className="mt-5" />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {hasImage(greentea.img) &&
            greentea.genres.map((genre) => (
              <span
                key={genre.id}
                className="border border-line bg-washi px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-olive"
              >
                {genre.name}
              </span>
            ))}
          <LikeButton
            kind="greentea"
            id={greentea.id}
            initialCount={greentea.likes_count}
            initialLiked={greentea.liked_by_current_user ?? false}
            callbackUrl={`/greenteas/${greentea.id}`}
          />
          {greentea.closed && (
            <span className="border border-bengara bg-bengara px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-paper">
              閉店
            </span>
          )}
        </div>
      </header>

      <div className="mt-6 flex justify-center">
        <ShareButtons title={greentea.name} />
      </div>

      <section className="mt-10">
        <p className="font-serif-jp text-base leading-[2.1] text-ink">
          {greentea.description}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mincho text-lg tracking-[0.12em] text-ink">
          店舗情報
          <span className="ml-3 font-sans-jp text-[10px] tracking-[0.3em] text-olive">
            INFO
          </span>
        </h2>
        <dl className="mt-4 border border-line-soft bg-paper px-5 sm:px-7">
          <InfoRow label="住所">{greentea.address}</InfoRow>
          <InfoRow label="アクセス">{greentea.access}</InfoRow>
          <InfoRow label="営業時間">{greentea.business_hours}</InfoRow>
          <InfoRow label="定休日">{greentea.holiday}</InfoRow>
          {greentea.phone_number && (
            <InfoRow label="電話番号">{greentea.phone_number}</InfoRow>
          )}
          {greentea.homepage && (
            <InfoRow label="HP">
              <a
                href={greentea.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-olive underline underline-offset-4 hover:text-olive-dark"
              >
                {greentea.homepage}
              </a>
            </InfoRow>
          )}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-mincho text-lg tracking-[0.12em] text-ink">
          近くの神社仏閣
          <span className="ml-3 font-sans-jp text-[10px] tracking-[0.3em] text-olive">
            NEARBY ( within 1.5km )
          </span>
        </h2>
        <div className="mt-4">
          <NearbySpotsMap
            origin={{
              lat: greentea.latitude,
              lng: greentea.longitude,
              name: greentea.name,
            }}
            spots={greentea.nearby_temples}
            kind="temple"
            emptyMessage="近隣 1.5km 以内に登録された神社仏閣はありません。"
          />
          <NearbySpotsList spots={greentea.nearby_temples} kind="temple" />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-mincho text-lg tracking-[0.12em] text-ink">
          コメント
          <span className="ml-3 font-sans-jp text-[10px] tracking-[0.3em] text-olive">
            COMMENTS
          </span>
        </h2>
        <div className="mt-4">
          <CommentSection
            kind="greentea"
            targetId={greentea.id}
            initialComments={greentea.comments}
            callbackUrl={`/greenteas/${greentea.id}`}
          />
        </div>
      </section>
    </article>
  );
}

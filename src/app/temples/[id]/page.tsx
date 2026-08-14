import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiArrowLeft } from "react-icons/hi2";
import { ToriiIcon } from "@/components/brand/icons";
import Hairline from "@/components/brand/Hairline";
import CommentSection from "@/components/common/CommentSection";
import LikeButton from "@/components/common/LikeButton";
import ShareButtons from "@/components/common/ShareButtons";
import SpotHeroPlaceholder from "@/components/common/SpotHeroPlaceholder";
import NearbySpotsMap from "@/components/map/NearbySpotsMap";
import { ApiError, getTemple } from "@/lib/api";
import { auth } from "@/lib/auth";
import { hasImage } from "@/lib/utils/image";
import { buildSpotMetadata } from "@/lib/utils/metadata";
import type { TempleDetail } from "@/types";

type RouteParams = { id: string };

async function fetchTemple(
  id: string,
  authToken?: string,
): Promise<TempleDetail> {
  try {
    const { temple } = await getTemple(id, authToken);
    return temple;
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
    const { temple } = await getTemple(id);
    return await buildSpotMetadata(temple.name, temple.description, parent);
  } catch {
    return { title: "神社の詳細" };
  }
}

// 外部リンクとして表示してよい URL かを判定する（javascript: 等の危険スキームを除外）。
function isSafeExternalUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
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

export default async function TempleDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;
  const session = await auth();
  const temple = await fetchTemple(id, session?.railsJwt);

  return (
    <article className="mx-auto w-full max-w-5xl px-6 py-12 md:px-12">
      <div className="mb-6">
        <Link
          href="/temples"
          className="inline-flex items-center gap-2 font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          <HiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          神社仏閣一覧へ
        </Link>
      </div>

      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-bengara">
          神社仏閣 / SHRINES &amp; TEMPLES
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.06em] text-ink sm:text-4xl">
          {temple.name}
        </h1>
        <Hairline width={40} className="mt-5" />
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {temple.areas.map((area) => (
            <span
              key={area.id}
              className="border border-line bg-washi px-2.5 py-1 font-sans-jp text-[11px] tracking-[0.1em] text-olive"
            >
              {area.name}
            </span>
          ))}
          <LikeButton
            kind="temple"
            id={temple.id}
            initialCount={temple.likes_count}
            initialLiked={temple.liked_by_current_user ?? false}
            callbackUrl={`/temples/${temple.id}`}
          />
        </div>
      </header>

      <div className="mt-6 flex justify-center">
        <ShareButtons title={temple.name} />
      </div>

      <figure className="mt-10 overflow-hidden border border-line-soft bg-paper">
        {hasImage(temple.img) ? (
          <div className="aspect-[16/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={temple.img}
              alt={temple.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <SpotHeroPlaceholder
            name={temple.name}
            tags={temple.areas}
            icon={<ToriiIcon size={28} color="#fbf6e5" />}
            variant="shrine"
          />
        )}
      </figure>

      <section className="mt-10">
        <p className="font-serif-jp text-base leading-[2.1] text-ink">
          {temple.description}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mincho text-lg tracking-[0.12em] text-ink">
          基本情報
          <span className="ml-3 font-sans-jp text-[10px] tracking-[0.3em] text-olive">
            INFO
          </span>
        </h2>
        <dl className="mt-4 border border-line-soft bg-paper px-5 sm:px-7">
          <InfoRow label="住所">{temple.address}</InfoRow>
          <InfoRow label="アクセス">{temple.access}</InfoRow>
          <InfoRow label="参拝時間">{temple.business_hours}</InfoRow>
          <InfoRow label="定休日">{temple.holiday}</InfoRow>
          {temple.phone_number && (
            <InfoRow label="電話番号">{temple.phone_number}</InfoRow>
          )}
          {temple.homepage && (
            <InfoRow label="HP">
              {isSafeExternalUrl(temple.homepage) ? (
                <a
                  href={temple.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-olive underline underline-offset-4 hover:text-olive-dark"
                >
                  {temple.homepage}
                </a>
              ) : (
                <span className="break-all text-muted">{temple.homepage}</span>
              )}
            </InfoRow>
          )}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-mincho text-lg tracking-[0.12em] text-ink">
          近くの抹茶店
          <span className="ml-3 font-sans-jp text-[10px] tracking-[0.3em] text-olive">
            NEARBY ( within 1.5km )
          </span>
        </h2>
        <div className="mt-4">
          <NearbySpotsMap
            origin={{
              lat: temple.latitude,
              lng: temple.longitude,
              name: temple.name,
            }}
            spots={temple.nearby_greenteas}
            kind="greentea"
            emptyMessage="近隣 1.5km 以内に登録された抹茶店はありません。"
          />
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
            kind="temple"
            targetId={temple.id}
            initialComments={temple.comments}
            callbackUrl={`/temples/${temple.id}`}
          />
        </div>
      </section>
    </article>
  );
}

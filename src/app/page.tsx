import Link from "next/link";
import { HiArrowRight, HiMagnifyingGlass, HiMapPin } from "react-icons/hi2";
import { getGreenteas, getTemples } from "@/lib/api";
import GreenteaCard from "@/components/greentea/GreenteaCard";
import TempleCard from "@/components/temple/TempleCard";

export const revalidate = 3600;

const RECOMMEND_LIMIT = 3;

export default async function Home() {
  const [greenteasResult, templesResult] = await Promise.allSettled([
    getGreenteas(),
    getTemples(),
  ]);

  const greenteas =
    greenteasResult.status === "fulfilled"
      ? greenteasResult.value.greenteas.slice(0, RECOMMEND_LIMIT)
      : [];
  const temples =
    templesResult.status === "fulfilled"
      ? templesResult.value.temples.slice(0, RECOMMEND_LIMIT)
      : [];

  return (
    <>
      <section className="hero min-h-[60vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold sm:text-5xl">
              <span className="text-primary">抹茶</span>と
              <span className="text-secondary">神社</span>。
            </h1>
            <p className="py-6 text-base-content/80">
              京都の抹茶スイーツと神社仏閣を、近さでつなぐ。
              お店のそばの神社、神社のそばの甘味処を見つけよう。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/greenteas" className="btn btn-primary">
                抹茶店をさがす
              </Link>
              <Link href="/temples" className="btn btn-secondary btn-outline">
                神社をさがす
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        {greenteas.length > 0 && (
          <section aria-labelledby="recommend-greenteas">
            <div className="flex items-end justify-between gap-4">
              <h2
                id="recommend-greenteas"
                className="text-2xl font-bold sm:text-3xl"
              >
                おすすめの<span className="text-primary">抹茶店</span>
              </h2>
              <Link
                href="/greenteas"
                className="link link-hover inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                一覧を見る
                <HiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {greenteas.map((greentea) => (
                <GreenteaCard key={greentea.id} greentea={greentea} />
              ))}
            </div>
          </section>
        )}

        {temples.length > 0 && (
          <section aria-labelledby="recommend-temples" className="mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2
                id="recommend-temples"
                className="text-2xl font-bold sm:text-3xl"
              >
                おすすめの<span className="text-secondary">神社</span>
              </h2>
              <Link
                href="/temples"
                className="link link-hover inline-flex items-center gap-1 text-sm font-medium text-secondary"
              >
                一覧を見る
                <HiArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {temples.map((temple) => (
                <TempleCard key={temple.id} temple={temple} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="explore" className="mt-16">
          <h2 id="explore" className="text-2xl font-bold sm:text-3xl">
            さがし方
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Link
              href="/greenteas"
              className="card bg-base-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <HiMagnifyingGlass
                className="h-8 w-8 text-primary"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-lg font-bold">抹茶店から探す</h3>
              <p className="mt-1 text-sm text-base-content/70">
                ジャンルや名前で京都の抹茶スイーツ店をさがせます。
              </p>
            </Link>
            <Link
              href="/temples"
              className="card bg-base-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <HiMagnifyingGlass
                className="h-8 w-8 text-secondary"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-lg font-bold">神社から探す</h3>
              <p className="mt-1 text-sm text-base-content/70">
                エリアや名前で京都の神社仏閣をさがせます。
              </p>
            </Link>
            <Link
              href="/nearby"
              className="card bg-base-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <HiMapPin className="h-8 w-8 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold">現在地から探す</h3>
              <p className="mt-1 text-sm text-base-content/70">
                いまいる場所の近くの抹茶店と神社をまとめてさがせます。
              </p>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

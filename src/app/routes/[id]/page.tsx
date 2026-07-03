import type { Metadata } from "next";
import Link from "next/link";
import RouteDetailView from "@/components/route/RouteDetailView";

// コース名は認証必須（JWT）でクライアント取得のため、サーバー側では静的な
// フォールバックタイトルを設定する（new / edit と同様にタブ・SEO 文脈を揃える）。
export const metadata: Metadata = {
  title: "コース詳細",
};

type RouteParams = { id: string };

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <div className="mb-6">
        <Link
          href="/routes"
          className="font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          ← モデルコース一覧へ
        </Link>
      </div>
      <RouteDetailView id={id} />
    </section>
  );
}

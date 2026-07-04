import type { Metadata, ResolvingMetadata } from "next";

const SITE_NAME = "抹茶と神社。";

// 抹茶店/神社仏閣など、スポット詳細ページ共通の OGP / Twitter カードを組み立てる。
// nested な openGraph / twitter を定義すると親（ルート）の設定を shallow merge で
// 上書きしてしまい、ルートの opengraph-image / twitter-image（サイト共通カード画像）が
// 落ちる。そのため parent から解決済みの画像を引き継いで og:image / twitter:image を維持する。
// 実 API のスポット画像 URL が用意でき次第、ここに固有画像を差し込む。
export async function buildSpotMetadata(
  name: string,
  description: string,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const resolvedParent = await parent;
  const ogImages = resolvedParent.openGraph?.images ?? [];
  const twitterImages = resolvedParent.twitter?.images ?? [];

  return {
    title: name,
    description,
    openGraph: {
      type: "article",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: name,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: twitterImages,
    },
  };
}

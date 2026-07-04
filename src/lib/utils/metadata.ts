import type { Metadata } from "next";

const SITE_NAME = "抹茶と神社。";

// 抹茶店/神社仏閣など、スポット詳細ページ共通の OGP / Twitter カードを組み立てる。
// OGP 画像はルートの opengraph-image（サイト共通）を継承する。
// 実 API の画像 URL が用意でき次第、ここに openGraph.images を追加する。
export function buildSpotMetadata(name: string, description: string): Metadata {
  return {
    title: name,
    description,
    openGraph: {
      type: "article",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: name,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

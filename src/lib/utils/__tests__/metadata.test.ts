import type { ResolvingMetadata } from "next";
import { describe, expect, it } from "vitest";
import { buildSpotMetadata } from "../metadata";

// buildSpotMetadata は parent（ルート）の解決済み metadata から
// og:image / twitter:image を引き継ぐ。ResolvingMetadata は Promise 互換なので
// 必要なフィールドだけ持つオブジェクトを resolve して渡す。
function fakeParent(
  openGraphImages: unknown,
  twitterImages: unknown,
): ResolvingMetadata {
  return Promise.resolve({
    openGraph: { images: openGraphImages },
    twitter: { images: twitterImages },
  }) as unknown as ResolvingMetadata;
}

describe("buildSpotMetadata", () => {
  it("title / description を設定する", async () => {
    const meta = await buildSpotMetadata(
      "中村藤吉本店",
      "宇治の老舗抹茶店。",
      fakeParent([], []),
    );

    expect(meta.title).toBe("中村藤吉本店");
    expect(meta.description).toBe("宇治の老舗抹茶店。");
    expect(meta.openGraph?.title).toBe("中村藤吉本店");
    expect(meta.openGraph?.description).toBe("宇治の老舗抹茶店。");
    expect(meta.twitter?.title).toBe("中村藤吉本店");
    expect(meta.twitter?.description).toBe("宇治の老舗抹茶店。");
  });

  it("親のサイト共通 og:image / twitter:image を継承する（画像継承の回帰防止）", async () => {
    const ogImages = [{ url: "https://example.com/og.png" }];
    const twitterImages = [{ url: "https://example.com/twitter.png" }];

    const meta = await buildSpotMetadata(
      "伏見稲荷大社",
      "千本鳥居の神社。",
      fakeParent(ogImages, twitterImages),
    );

    expect(meta.openGraph?.images).toBe(ogImages);
    expect(meta.twitter?.images).toBe(twitterImages);
  });

  it("openGraph は article / ja_JP / siteName を持つ", async () => {
    const meta = await buildSpotMetadata("店名", "説明", fakeParent([], []));

    expect(meta.openGraph).toMatchObject({
      type: "article",
      locale: "ja_JP",
      siteName: "抹茶と神社。",
    });
    expect(meta.twitter?.card).toBe("summary_large_image");
  });

  it("親に画像が無くても空配列にフォールバックして壊れない", async () => {
    const empty = Promise.resolve({}) as unknown as ResolvingMetadata;

    const meta = await buildSpotMetadata("店名", "説明", empty);

    expect(meta.openGraph?.images).toEqual([]);
    expect(meta.twitter?.images).toEqual([]);
  });
});

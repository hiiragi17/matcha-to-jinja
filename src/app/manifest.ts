import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "抹茶と神社。",
    short_name: "抹茶と神社。",
    description:
      "京都の抹茶スイーツ店と神社仏閣を、近さでつなぐ非公式ガイド。",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6e5",
    theme_color: "#fbf6e5",
    lang: "ja",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

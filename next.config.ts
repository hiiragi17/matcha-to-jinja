import type { NextConfig } from "next";
import { buildCsp } from "./src/lib/security/csp";

const nextConfig: NextConfig = {
  // Next 16 の dev サーバーは、許可されていないオリジンから /_next/hmr などの開発用
  // リソースへのアクセスを既定でブロックする。E2E（Playwright）は
  // http://127.0.0.1:3000 で開くため、ここを許可しないとクライアント側の処理が動かず、
  // 検索フォームの URL 反映や mock ログイン後の遷移が失敗する。本番ビルドには影響しない。
  allowedDevOrigins: ["127.0.0.1"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp({
              apiUrl: process.env.NEXT_PUBLIC_API_URL,
              isDev: process.env.NODE_ENV !== "production",
            }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

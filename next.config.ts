import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 の dev サーバーは、許可されていないオリジンから /_next/hmr などの開発用
  // リソースへのアクセスを既定でブロックする。E2E（Playwright）は
  // http://127.0.0.1:3000 で開くため、ここを許可しないとクライアント側の処理が動かず、
  // 検索フォームの URL 反映や mock ログイン後の遷移が失敗する。本番ビルドには影響しない。
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;

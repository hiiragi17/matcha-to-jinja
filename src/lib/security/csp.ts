// Content-Security-Policy の組み立て。next.config.ts の headers() から使う。
//
// 方針:
// - コメント等のユーザー入力は React が自動エスケープしており、現時点で XSS の入口は無い。
//   CSP は将来の混入や依存ライブラリの脆弱性に備える多層防御として入れる。
// - nonce 方式は全ページを動的レンダリングにしてしまい静的配信の利点を失うため、
//   script-src は 'unsafe-inline' を許容しつつ、読み込み元ホストの制限・
//   object-src / base-uri / frame-ancestors の封じ込めで効果を得る。

const GOOGLE_MAPS_HOSTS = [
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
];

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function buildCsp({
  apiUrl,
  isDev,
}: {
  apiUrl?: string;
  isDev: boolean;
}): string {
  const apiOrigin = originOf(apiUrl);

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...GOOGLE_MAPS_HOSTS,
    // Next.js の dev サーバー（React Refresh）は eval を使う
    ...(isDev ? ["'unsafe-eval'"] : []),
    // @vercel/analytics は dev のみ debug 版ローダーを va.vercel-scripts.com から読む
    ...(isDev ? ["https://va.vercel-scripts.com"] : []),
  ];

  const connectSrc = [
    "'self'",
    ...(apiOrigin ? [apiOrigin] : []),
    "https://maps.googleapis.com",
    // Google Maps が地図タイル／統計送信に使う
    "https://*.googleapis.com",
    "https://*.google.com",
    "https://*.gstatic.com",
    ...(isDev ? ["ws:", "http://localhost:*"] : []),
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    // Google Maps が動的に <style> を挿入する
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    // 店舗・神社の画像は Rails(CarrierWave)/外部 URL をそのまま表示する
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      // dev ではローカル Rails（http://localhost:3001）の画像を表示できるようにする
      ...(isDev ? ["http:"] : []),
    ],
    // next/font/google はビルド時に自己ホスト化されるため 'self' で足りる
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": connectSrc,
    // Google Maps の Web Worker
    "worker-src": ["'self'", "blob:"],
    // Google Maps が内部で Google 所有のフレームを使う（公式の CSP ガイドで必須）
    "frame-src": ["https://*.google.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(
    ([name, values]) => `${name} ${values.join(" ")}`,
  );
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

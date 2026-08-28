import type { Metadata, Viewport } from "next";
import { Shippori_Mincho, Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomTabBar from "@/components/layout/BottomTabBar";
import AuthProvider from "@/components/auth/AuthProvider";

const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori-mincho",
});

const notoSerifJP = Noto_Serif_JP({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-serif-jp",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

const DEFAULT_SITE_URL = "https://matcha-to-jinja.vercel.app";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const METADATA_BASE = (() => {
  try {
    return new URL(SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
})();

const SITE_DESCRIPTION =
  "京都の抹茶スイーツ店と神社仏閣を、近さでつなぐ非公式ガイド。お店のそばの神社、神社のそばの甘味処を見つけられます。";

export const metadata: Metadata = {
  title: {
    default: "抹茶と神社。",
    template: "%s | 抹茶と神社。",
  },
  description: SITE_DESCRIPTION,
  metadataBase: METADATA_BASE,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "抹茶と神社。",
    title: "抹茶と神社。",
    description: SITE_DESCRIPTION,
    // 画像は src/app/opengraph-image.tsx（ファイル規約）で自動付与される
  },
  twitter: {
    card: "summary_large_image",
    title: "抹茶と神社。",
    description: SITE_DESCRIPTION,
    // 画像は src/app/twitter-image.tsx（ファイル規約）で自動付与される
  },
  appleWebApp: {
    title: "抹茶と神社。",
    // アイコンは src/app/apple-icon.png（ファイル規約）で自動付与される
  },
  // manifest, favicon, apple-touch-icon は src/app/manifest.ts, favicon.ico, apple-icon.png（ファイル規約）で自動付与される
};

export const viewport: Viewport = {
  themeColor: "#fbf6e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      data-theme="matcha"
      className={`${shipporiMincho.variable} ${notoSerifJP.variable} ${notoSansJP.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-washi font-serif-jp text-ink">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <BottomTabBar />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

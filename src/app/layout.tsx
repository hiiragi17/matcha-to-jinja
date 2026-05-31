import type { Metadata } from "next";
import { Shippori_Mincho, Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "抹茶と神社。" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "抹茶と神社。",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
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
        </AuthProvider>
      </body>
    </html>
  );
}

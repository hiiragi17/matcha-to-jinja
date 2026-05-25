import type { Metadata } from "next";
import { Shippori_Mincho, Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: {
    default: "抹茶と神社。",
    template: "%s | 抹茶と神社。",
  },
  description:
    "京都の抹茶スイーツ店と神社仏閣を、近さでつなぐ非公式ガイド。お店のそばの神社、神社のそばの甘味処を見つけられます。",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

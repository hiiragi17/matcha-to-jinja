import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
    <html lang="ja" data-theme="matcha">
      <body className="flex min-h-screen flex-col bg-base-200 text-base-content">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

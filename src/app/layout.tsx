import type { Metadata } from 'next';
import { Geist, Geist_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | 抹茶と神社。',
    default: '抹茶と神社。- 京都の抹茶スイーツ店と神社仏閣',
  },
  description:
    '京都の抹茶スイーツ店と神社仏閣を組み合わせて紹介するWebアプリ。抹茶パフェや抹茶スイーツが楽しめるお店と、近隣の神社仏閣を一緒に探せます。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" data-theme="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

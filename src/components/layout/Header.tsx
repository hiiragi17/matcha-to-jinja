import Link from "next/link";
import Logo from "@/components/brand/Logo";
import MobileNav from "@/components/layout/MobileNav";
import Navigation from "@/components/layout/Navigation";
import HeaderAuth from "@/components/auth/HeaderAuth";

export default function Header() {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line px-6 py-[18px] sm:gap-8 md:px-12">
      <Link
        href="/"
        aria-label="抹茶と神社。 トップへ"
        className="inline-flex items-center gap-2 sm:gap-2.5"
      >
        <Logo variant="compact" size={42} priority />
        <span className="whitespace-nowrap font-mincho text-base font-semibold tracking-[0.04em] text-ink sm:text-lg sm:tracking-[0.08em] lg:text-xl">
          抹茶と神社。
        </span>
      </Link>

      <nav className="hidden justify-center lg:flex">
        <Navigation />
      </nav>

      {/* 右端エリア: PC は認証、タブレット・モバイルはハンバーガー */}
      <div className="justify-self-end">
        <div className="hidden items-center gap-4 lg:flex">
          <HeaderAuth />
        </div>

        <MobileNav />
      </div>
    </header>
  );
}

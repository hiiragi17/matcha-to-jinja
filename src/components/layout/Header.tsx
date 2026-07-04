import Link from "next/link";
import { HiBars3 } from "react-icons/hi2";
import Logo from "@/components/brand/Logo";
import Navigation from "@/components/layout/Navigation";
import HeaderAuth from "@/components/auth/HeaderAuth";

export default function Header() {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-8 border-b border-line px-6 py-[18px] md:px-12">
      <Link
        href="/"
        aria-label="抹茶と神社。 トップへ"
        className="inline-flex items-center gap-2.5"
      >
        <Logo variant="compact" size={42} priority />
        <span className="whitespace-nowrap font-mincho text-lg font-semibold tracking-[0.08em] text-ink sm:text-xl">
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

        <details className="dropdown dropdown-end lg:hidden">
          <summary className="btn btn-ghost btn-square" aria-label="メニューを開く">
            <HiBars3 className="h-5 w-5" />
          </summary>
          <div className="dropdown-content z-50 mt-3 flex w-60 flex-col gap-5 border border-line bg-paper p-5">
            <Navigation orientation="vertical" />
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <HeaderAuth />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

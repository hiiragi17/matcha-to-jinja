import Link from "next/link";
import { HiBars3 } from "react-icons/hi2";
import Logo from "@/components/brand/Logo";
import Navigation from "./Navigation";

function HeaderActions() {
  return (
    <>
      <Link
        href="/mypage"
        className="font-sans-jp text-xs tracking-[0.06em] text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">♡</span> お気に入り
      </Link>
      <Link
        href="/auth/login"
        className="border border-olive px-3.5 py-1.5 font-mincho text-[13px] text-ink transition-colors hover:bg-olive hover:text-paper"
      >
        ログイン
      </Link>
    </>
  );
}

export default function Header() {
  return (
    <header className="grid grid-cols-[auto_1fr_auto] items-center gap-8 border-b border-line px-6 py-[18px] md:px-12">
      <Link href="/" aria-label="抹茶と神社。 トップへ" className="inline-flex">
        <Logo variant="compact" size={42} priority />
      </Link>

      <nav className="hidden justify-center lg:flex">
        <Navigation />
      </nav>

      <div className="hidden items-center gap-4 lg:flex">
        <HeaderActions />
      </div>

      {/* タブレット・モバイル: ハンバーガー */}
      <details className="dropdown dropdown-end justify-self-end lg:hidden">
        <summary className="btn btn-ghost btn-square" aria-label="メニューを開く">
          <HiBars3 className="h-5 w-5" />
        </summary>
        <div className="dropdown-content z-50 mt-3 flex w-60 flex-col gap-5 border border-line bg-paper p-5">
          <Navigation orientation="vertical" />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <HeaderActions />
          </div>
        </div>
      </details>
    </header>
  );
}

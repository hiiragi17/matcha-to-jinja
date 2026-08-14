"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { HiHeart, HiHome, HiMapPin } from "react-icons/hi2";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";

const ACTIVE_COLOR = "#3d3322"; // --color-ink
const INACTIVE_COLOR = "#8a7a4e"; // --color-muted

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Tab({
  active,
  children,
  label,
}: {
  active: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className={`flex flex-1 flex-col items-center gap-1 border-t-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 font-sans-jp text-[10px] tracking-[0.05em] transition-colors ${
        active ? "border-bengara text-ink" : "border-transparent text-muted"
      }`}
    >
      {children}
      {label}
    </span>
  );
}

// スマホ幅ではハンバーガーメニューの代わりに画面下部の固定タブで主要導線を表示する。
export default function BottomTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const myHref = session?.user ? "/mypage" : "/auth/login";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-paper lg:hidden"
      aria-label="モバイルナビゲーション"
    >
      <Link
        href="/"
        className="flex-1"
        aria-current={isActive(pathname, "/") ? "page" : undefined}
      >
        <Tab active={isActive(pathname, "/")} label="ホーム">
          <HiHome className="h-5 w-5" aria-hidden="true" />
        </Tab>
      </Link>
      <Link
        href="/greenteas"
        className="flex-1"
        aria-current={isActive(pathname, "/greenteas") ? "page" : undefined}
      >
        <Tab active={isActive(pathname, "/greenteas")} label="抹茶">
          <ChawanIcon
            size={20}
            color={isActive(pathname, "/greenteas") ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
        </Tab>
      </Link>
      <Link
        href="/temples"
        className="flex-1"
        aria-current={isActive(pathname, "/temples") ? "page" : undefined}
      >
        <Tab active={isActive(pathname, "/temples")} label="神社">
          <ToriiIcon
            size={20}
            color={isActive(pathname, "/temples") ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
        </Tab>
      </Link>
      <Link
        href="/nearby"
        className="flex-1"
        aria-current={isActive(pathname, "/nearby") ? "page" : undefined}
      >
        <Tab active={isActive(pathname, "/nearby")} label="現在地">
          <HiMapPin className="h-5 w-5" aria-hidden="true" />
        </Tab>
      </Link>
      <Link
        href={myHref}
        className="flex-1"
        aria-current={isActive(pathname, myHref) ? "page" : undefined}
      >
        <Tab active={isActive(pathname, myHref)} label="マイ">
          <HiHeart className="h-5 w-5" aria-hidden="true" />
        </Tab>
      </Link>
    </nav>
  );
}

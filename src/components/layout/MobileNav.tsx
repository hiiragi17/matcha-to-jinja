"use client";

import { useRef } from "react";
import { HiBars3 } from "react-icons/hi2";
import HeaderAuth from "@/components/auth/HeaderAuth";
import Navigation from "@/components/layout/Navigation";

// <details> はページ遷移してもブラウザネイティブの開閉状態を保持したままになり、
// 別ページに移動してもメニューが開いたまま残ってしまう。メニュー内のリンク/ボタンを
// クリックした時点（遷移が起きる直前）で明示的に閉じることで解消する。
export default function MobileNav() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details ref={detailsRef} className="dropdown dropdown-end lg:hidden">
      <summary className="btn btn-ghost btn-square" aria-label="メニューを開く">
        <HiBars3 className="h-5 w-5" />
      </summary>
      <div
        className="dropdown-content z-50 mt-3 flex w-60 flex-col gap-5 border border-line bg-paper p-5"
        onClick={close}
      >
        <Navigation orientation="vertical" />
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <HeaderAuth />
        </div>
      </div>
    </details>
  );
}

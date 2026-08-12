"use client";

import { useRef } from "react";
import { HiBars3 } from "react-icons/hi2";
import { useCloseOnOutsideClick } from "@/lib/utils/useCloseOnOutsideClick";
import HeaderAuth from "../auth/HeaderAuth";
import Navigation from "./Navigation";

// <details> はページ遷移してもブラウザネイティブの開閉状態を保持したままになり、
// 別ページに移動してもメニューが開いたまま残ってしまう。メニュー内のリンク/ボタンを
// クリックした時点（遷移が起きる直前）で明示的に閉じることで解消する。
export default function MobileNav() {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  // 外側クリックでも閉じる（<details> はネイティブでは summary の再クリックでしか閉じない）。
  useCloseOnOutsideClick(detailsRef);

  // 入れ子の UserMenu（アバターの details）の summary クリックもこの div まで
  // バブリングしてくる。a/button 以外（= summary の開閉トグル）まで閉じてしまうと
  // 認証済みユーザーが UserMenu を開けなくなるため、実際に遷移/操作するリンクと
  // ボタンのクリックだけを閉鎖トリガーにする。
  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button")
    ) {
      close();
    }
  };

  return (
    <details ref={detailsRef} className="dropdown dropdown-end lg:hidden">
      <summary className="btn btn-ghost btn-square" aria-label="メニューを開く">
        <HiBars3 className="h-5 w-5" />
      </summary>
      <div
        className="dropdown-content z-50 mt-3 flex w-60 flex-col gap-5 border border-line bg-paper p-5"
        onClick={handleContentClick}
      >
        <Navigation orientation="vertical" />
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <HeaderAuth />
        </div>
      </div>
    </details>
  );
}

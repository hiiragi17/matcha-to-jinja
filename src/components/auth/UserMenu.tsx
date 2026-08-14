"use client";

import Link from "next/link";
import { useRef } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useCloseOnOutsideClick } from "@/lib/utils/useCloseOnOutsideClick";

type UserMenuProps = {
  user: NonNullable<Session["user"]>;
};

export default function UserMenu({ user }: UserMenuProps) {
  const displayName = user.name ?? "ゲスト";
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // <details> はページ遷移してもブラウザネイティブの開閉状態を保持したままになるため、
  // メニュー内のリンク/ボタンをクリックした時点で明示的に閉じる。
  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  // 外側クリックでも閉じる（<details> はネイティブでは summary の再クリックでしか閉じない）。
  useCloseOnOutsideClick(detailsRef);

  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 border border-line px-3 py-1.5 font-mincho text-[13px] text-ink transition-colors hover:bg-olive hover:text-paper"
        aria-label="ユーザーメニューを開く"
      >
        <span aria-hidden="true">◎</span>
        <span className="hidden max-w-[8rem] truncate lg:inline">{displayName}</span>
      </summary>
      <ul
        className="dropdown-content menu z-50 mt-2 w-56 border border-line bg-paper p-2 font-sans-jp text-sm text-ink shadow-sm"
        onClick={close}
      >
        <li>
          <Link href="/mypage" className="rounded-none">
            マイページ
          </Link>
        </li>
        <li className="border-t border-line">
          <button
            type="button"
            className="rounded-none text-left text-muted hover:text-ink"
            onClick={() => signOut({ redirectTo: "/" })}
          >
            ログアウト
          </button>
        </li>
      </ul>
    </details>
  );
}

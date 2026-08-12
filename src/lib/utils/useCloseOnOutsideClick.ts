"use client";

import { useEffect, type RefObject } from "react";

// <details> はブラウザネイティブでは外側クリックで閉じない（summary の再クリックのみ）。
// 開いている間だけ document のクリックを監視し、要素の外側をクリックしたら閉じる。
export function useCloseOnOutsideClick(
  ref: RefObject<HTMLDetailsElement | null>,
): void {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const el = ref.current;
      if (!el?.open) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        el.open = false;
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [ref]);
}

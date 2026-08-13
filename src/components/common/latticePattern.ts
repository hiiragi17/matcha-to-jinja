import type { CSSProperties } from "react";

// 緑地プレースホルダー共通の格子柄背景（カード/詳細ヒーローで共用）。
export const latticeBackgroundStyle: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(251,246,229,0.1) 0, rgba(251,246,229,0.1) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(251,246,229,0.1) 0, rgba(251,246,229,0.1) 1px, transparent 1px, transparent 18px)",
};

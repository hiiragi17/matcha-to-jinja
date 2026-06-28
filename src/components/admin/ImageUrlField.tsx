"use client";

import { useState } from "react";

type ImageUrlFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  registration: React.ComponentProps<"input">;
};

// 画像は MVP として URL 入力のみ（issue #71 方針）。入力された URL の
// プレビューを表示し、壊れた URL のときは控えめに案内する。
export default function ImageUrlField({
  id,
  label,
  value,
  error,
  registration,
}: ImageUrlFieldProps) {
  const [broken, setBroken] = useState(false);
  const trimmed = value.trim();
  const showPreview = trimmed !== "" && /^https?:\/\//i.test(trimmed);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans-jp text-[11px] tracking-[0.2em] text-olive"
      >
        {label}
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        placeholder="https://..."
        className="h-10 border border-line bg-washi px-3 font-serif-jp text-sm text-ink placeholder:text-muted/60 focus:border-olive focus:outline-none"
        {...registration}
        onChange={(e) => {
          setBroken(false);
          registration.onChange?.(e);
        }}
      />
      {error && (
        <p role="alert" className="font-sans-jp text-xs text-bengara">
          {error}
        </p>
      )}
      {showPreview && (
        <div className="mt-1">
          {broken ? (
            <p className="font-sans-jp text-[11px] text-muted">
              画像を読み込めませんでした。URL をご確認ください。
            </p>
          ) : (
            // 外部 URL のプレビュー。next/image は許可ドメイン設定が要るため、
            // 管理プレビューでは素の img を使う。
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trimmed}
              alt="プレビュー"
              className="h-32 w-auto border border-line object-cover"
              onError={() => setBroken(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}

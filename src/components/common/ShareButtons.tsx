"use client";

import { useEffect, useState } from "react";
import { RiTwitterXLine } from "react-icons/ri";
import { SiLine } from "react-icons/si";

type ShareButtonsProps = {
  title: string;
};

export default function ShareButtons({ title }: ShareButtonsProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  if (!url) return null;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex items-center gap-3">
      <span className="font-sans-jp text-[10px] tracking-[0.3em] text-muted">
        SHARE
      </span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X（Twitter）でシェア"
        className="flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
      >
        <RiTwitterXLine className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINEでシェア"
        className="flex h-8 w-8 items-center justify-center border border-line text-ink transition-colors hover:border-[#06C755] hover:bg-[#06C755] hover:text-paper"
      >
        <SiLine className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

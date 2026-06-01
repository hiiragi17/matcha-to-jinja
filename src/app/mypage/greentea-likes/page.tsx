import type { Metadata } from "next";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2";
import Hairline from "@/components/brand/Hairline";
import LikedSpotsList from "@/components/common/LikedSpotsList";

export const metadata: Metadata = {
  title: "お気に入りの抹茶店",
};

export default function GreenteaLikesPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12 md:px-12">
      <div className="mb-6">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          <HiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          マイページへ
        </Link>
      </div>

      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          お気に入り / FAVORITES
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
          抹茶店
        </h1>
        <Hairline width={40} className="mt-5" />
      </header>

      <div className="mt-10">
        <LikedSpotsList kind="greentea" />
      </div>
    </section>
  );
}

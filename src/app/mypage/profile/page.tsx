import type { Metadata } from "next";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2";
import Hairline from "@/components/brand/Hairline";
import ProfileEditForm from "@/components/auth/ProfileEditForm";

export const metadata: Metadata = {
  title: "プロフィール編集",
};

export default function ProfileEditPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-6">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          <HiArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          マイページへ
        </Link>
      </div>

      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        マイページ / PROFILE
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        プロフィール編集
      </h1>
      <Hairline width={40} className="mt-5" />

      <div className="mt-10">
        <ProfileEditForm />
      </div>
    </section>
  );
}

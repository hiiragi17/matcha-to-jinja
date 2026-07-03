import type { Metadata } from "next";
import Link from "next/link";
import Hairline from "@/components/brand/Hairline";
import RouteEditForm from "@/components/route/RouteEditForm";

export const metadata: Metadata = {
  title: "コースを編集",
};

type RouteParams = { id: string };

export default async function EditRoutePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id } = await params;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-6">
        <Link
          href={`/routes/${id}`}
          className="font-sans-jp text-xs tracking-[0.15em] text-olive transition-colors hover:text-olive-dark"
        >
          ← コース詳細へ戻る
        </Link>
      </div>
      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        MODEL COURSE / EDIT
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        コースを編集
      </h1>
      <Hairline width={40} className="mt-5" />

      <div className="mt-10">
        <RouteEditForm id={id} />
      </div>
    </section>
  );
}

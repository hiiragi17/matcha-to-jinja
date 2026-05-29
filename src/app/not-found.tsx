import Link from "next/link";
import Hairline from "@/components/brand/Hairline";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mincho text-[64px] font-semibold leading-none tracking-[0.05em] text-line">
        404
      </p>
      <p className="mt-4 font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        ページが見つかりません / NOT FOUND
      </p>
      <h1 className="mt-3 font-mincho text-2xl font-semibold tracking-[0.05em] text-ink">
        お探しのページは見つかりませんでした
      </h1>
      <Hairline width={40} className="mt-5" />
      <p className="mt-5 max-w-md font-serif-jp text-sm leading-[2] text-muted">
        URLが変更されたか、ページが削除された可能性があります。
        <br />
        トップページから再度お探しください。
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="border border-olive px-6 py-2.5 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-olive hover:text-paper"
        >
          トップへ戻る
        </Link>
        <Link
          href="/greenteas"
          className="border border-line px-6 py-2.5 font-mincho text-[13px] tracking-[0.15em] text-muted transition-colors hover:border-olive hover:text-ink"
        >
          抹茶店を探す
        </Link>
      </div>
    </section>
  );
}

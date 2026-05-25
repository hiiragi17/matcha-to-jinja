import Link from "next/link";
import Hairline from "@/components/brand/Hairline";

type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        準備中 / COMING SOON
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        {title}
      </h1>
      <Hairline width={40} className="mt-5" />
      <p className="mt-5 max-w-md font-serif-jp text-sm leading-[2] text-muted">
        {description ??
          "このページは現在準備中です。公開までもうしばらくお待ちください。"}
      </p>
      <Link
        href="/"
        className="mt-8 border border-olive px-5 py-2.5 font-mincho text-[13px] tracking-[0.15em] text-ink transition-colors hover:bg-olive hover:text-paper"
      >
        トップへ戻る
      </Link>
    </section>
  );
}

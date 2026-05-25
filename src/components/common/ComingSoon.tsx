import Link from "next/link";

type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <section className="hero min-h-[60vh]">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-widest text-primary">
            準備中
          </p>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="py-4 text-base-content/70">
            {description ??
              "このページは現在準備中です。公開までもうしばらくお待ちください。"}
          </p>
          <Link href="/" className="btn btn-primary btn-sm">
            トップへ戻る
          </Link>
        </div>
      </div>
    </section>
  );
}

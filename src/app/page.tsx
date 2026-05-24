import Link from "next/link";

export default function Home() {
  return (
    <section className="hero min-h-[60vh] bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold sm:text-5xl">
            <span className="text-primary">抹茶</span>と
            <span className="text-secondary">神社</span>。
          </h1>
          <p className="py-6 text-base-content/80">
            京都の抹茶スイーツと神社仏閣を、近さでつなぐ。
            お店のそばの神社、神社のそばの甘味処を見つけよう。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/greenteas" className="btn btn-primary">
              抹茶店をさがす
            </Link>
            <Link href="/temples" className="btn btn-secondary btn-outline">
              神社をさがす
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/brand/Logo";
import Hairline from "@/components/brand/Hairline";
import { ChawanIcon, ToriiIcon } from "@/components/brand/icons";
import { PatternBackground } from "@/components/brand/patterns";

type ActionRowProps = {
  href: string;
  icon: ReactNode;
  bgClass: string;
  label: string;
  hint: string;
};

function ActionRow({ href, icon, bgClass, label, hint }: ActionRowProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-[22px] py-4 text-paper transition-colors ${bgClass}`}
    >
      <span className="flex w-9 items-center justify-center">{icon}</span>
      <span className="flex-1">
        <span className="block font-mincho text-[17px] font-semibold tracking-[0.08em]">
          {label}
        </span>
        <span className="mt-0.5 block font-sans-jp text-[9px] tracking-[0.3em] opacity-70">
          {hint}
        </span>
      </span>
      <span className="font-mincho text-[18px]" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <section className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-6 py-16">
      <PatternBackground id="home-asanoha" color="#706020" opacity={0.08} size={56} />

      <div className="relative flex flex-col items-center gap-7">
        <Logo variant="full" size={300} priority />

        <p className="text-center font-mincho text-[17px] leading-[2] text-ink">
          折角京都に来たのなら、
          <br />
          神社仏閣と抹茶スイーツ店どちらも欲張って巡ってみよう。
        </p>

        <Hairline width={50} className="mt-2" />

        <div className="mt-2 flex w-full max-w-[380px] flex-col gap-2.5">
          <ActionRow
            href="/temples"
            icon={<ToriiIcon size={22} color="#fbf6e5" />}
            bgClass="bg-bengara hover:bg-bengara-dark"
            label="神社仏閣を探す"
            hint="SHRINES & TEMPLES"
          />
          <ActionRow
            href="/greenteas"
            icon={<ChawanIcon size={22} color="#fbf6e5" />}
            bgClass="bg-matcha hover:bg-matcha-dark"
            label="抹茶スイーツを探す"
            hint="MATCHA SWEETS"
          />
          <ActionRow
            href="/nearby"
            icon={
              <span className="font-mincho text-[18px] text-paper" aria-hidden="true">
                ⊕
              </span>
            }
            bgClass="bg-olive hover:bg-olive-dark"
            label="現在地から両方を探す"
            hint="NEARBY · CURRENT LOCATION"
          />
        </div>
      </div>
    </section>
  );
}

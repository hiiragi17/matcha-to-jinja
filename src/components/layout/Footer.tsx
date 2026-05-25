import Link from "next/link";
import { NAV_LINKS } from "./Navigation";

export default function Footer() {
  return (
    <footer className="bg-neutral text-neutral-content">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="text-lg font-bold">
              <span className="text-primary">抹茶</span>と
              <span className="text-secondary">神社</span>。
            </p>
            <p className="mt-2 max-w-md text-sm opacity-80">
              京都の抹茶スイーツ店と神社仏閣を組み合わせて紹介する非公式ガイドです。
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="link link-hover">
                {link.label}
              </Link>
            ))}
            <Link href="/terms" className="link link-hover">
              利用規約
            </Link>
            <Link href="/privacy" className="link link-hover">
              プライバシーポリシー
            </Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-neutral-content/20 pt-6 text-xs opacity-70">
          <p>
            本サイトは非公式のファンサイトであり、掲載している店舗・神社仏閣とは一切関係ありません。掲載情報の正確性・最新性は保証されません。
          </p>
          <p className="mt-1">
            画像・各種情報の出典は、それぞれの店舗・施設および公式サイトに帰属します。
          </p>
        </div>
      </div>
    </footer>
  );
}

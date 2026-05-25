import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシー" },
  { href: "/nearby", label: "現在地から" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-line px-6 py-5 font-sans-jp text-[10px] tracking-[0.1em] text-muted md:px-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 抹茶と神社。</span>
        <nav className="flex items-center gap-3">
          {FOOTER_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden="true">・</span>}
              <Link href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <p className="mt-4 max-w-3xl leading-[1.9] text-muted/80">
        本サイトは非公式のファンサイトであり、掲載している店舗・神社仏閣とは一切関係ありません。掲載情報・画像の出典はそれぞれの店舗・施設および公式サイトに帰属します。
      </p>
    </footer>
  );
}

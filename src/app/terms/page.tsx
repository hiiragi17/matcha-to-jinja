import type { Metadata } from "next";
import Hairline from "@/components/brand/Hairline";

export const metadata: Metadata = {
  title: "利用規約",
  description: "抹茶と神社。の利用規約です。",
};

type Section = { heading: string; body: string | string[] };

const SECTIONS: Section[] = [
  {
    heading: "1. 本サイトについて",
    body: "「抹茶と神社。」（以下「本サイト」）は、京都の抹茶スイーツ店と神社仏閣の情報を個人が非公式にまとめたファンサイトです。掲載店舗・施設とは一切の資本・業務上の関係はありません。",
  },
  {
    heading: "2. 情報の正確性",
    body: [
      "掲載している営業時間・定休日・住所・電話番号などの情報は、公開時点での内容を参考にしていますが、正確性・最新性を保証するものではありません。",
      "ご訪問前には必ず各店舗・施設の公式サイトまたは電話にてご確認ください。",
    ],
  },
  {
    heading: "3. 画像・著作権",
    body: "本サイトに表示される画像の著作権は、それぞれの撮影者・運営者に帰属します。無断転載・複製はお控えください。",
  },
  {
    heading: "4. 免責事項",
    body: "本サイトの情報を利用したことによって生じたいかなる損害についても、運営者は一切の責任を負いません。",
  },
  {
    heading: "5. 外部リンク",
    body: "本サイトは各店舗・施設の公式サイトへのリンクを含む場合があります。リンク先のコンテンツについては各サイトの運営者が責任を負います。",
  },
  {
    heading: "6. 規約の変更",
    body: "運営者は予告なく本規約を変更する場合があります。変更後の規約はサイト上に掲示した時点で効力を持ちます。",
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-14 md:px-12">
      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          利用規約 / TERMS OF USE
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
          利用規約
        </h1>
        <Hairline width={40} className="mt-5" />
        <p className="mt-5 font-serif-jp text-sm leading-[2] text-muted">
          本サイトをご利用いただく前に、以下の利用規約をお読みください。
        </p>
      </header>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-mincho text-lg tracking-[0.08em] text-ink border-b border-line pb-2">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-3">
              {Array.isArray(section.body) ? (
                section.body.map((para, i) => (
                  <p key={i} className="font-serif-jp text-sm leading-[2.1] text-ink">
                    {para}
                  </p>
                ))
              ) : (
                <p className="font-serif-jp text-sm leading-[2.1] text-ink">
                  {section.body}
                </p>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 text-right font-sans-jp text-[11px] tracking-[0.1em] text-muted">
        最終更新: 2026年5月
      </p>
    </article>
  );
}

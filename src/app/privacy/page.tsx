import type { Metadata } from "next";
import Hairline from "@/components/brand/Hairline";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "抹茶と神社。のプライバシーポリシーです。",
};

type Section = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

const SECTIONS: Section[] = [
  {
    heading: "1. お客様から取得する情報",
    paragraphs: ["本サイトは、お客様から以下の情報を取得します。"],
    list: [
      "メールアドレス",
      "外部サービス（Google・LINE）でお客様が利用するID、その他外部サービスのプライバシー設定によりお客様が連携先に開示を認めた情報",
      "Cookie（クッキー）を用いて生成された識別情報",
      "本サイトの滞在時間・閲覧履歴等、本サイトにおけるお客様の行動履歴（IPアドレス・閲覧ページ・ブラウザ情報等のアクセスログを含みます）",
      "現在地検索機能をご利用の場合の位置情報",
      "口コミ投稿の内容",
    ],
  },
  {
    heading: "2. お客様の情報を利用する目的",
    paragraphs: ["本サイトは、お客様から取得した情報を、以下の目的のために利用します。"],
    list: [
      "本サイトの利用登録の受付、お客様の本人確認、認証のため",
      "お気に入り・口コミ等、お客様の利用履歴を管理するため",
      "本サイトにおけるお客様の行動履歴を分析し、本サイトの維持改善に役立てるため",
      "現在地検索機能等、位置情報を利用したサービスを提供するため",
      "お客様からのお問い合わせに対応するため",
      "本サイトの利用規約や法令に違反する行為に対応するため",
      "本サイトの変更、提供中止、終了をご連絡するため",
      "以上のほか、本サイトの提供、維持、保護及び改善のため",
    ],
  },
  {
    heading: "3. Cookie",
    paragraphs: [
      "本サイトはログイン状態の管理（セッション管理）のためにCookieを使用します。ブラウザの設定によりCookieを無効化することができますが、一部機能が利用できなくなる場合があります。",
    ],
  },
  {
    heading: "4. 安全管理のために講じた措置",
    paragraphs: [
      "本サイトが、お客様から取得した情報に関して安全管理のために講じた措置につきましては、末尾記載のお問い合わせ先にご連絡いただければ、可能な範囲で個別にご回答します。",
    ],
  },
  {
    heading: "5. 第三者提供",
    paragraphs: [
      "本サイトは、お客様から取得した個人データについて、あらかじめお客様の同意を得ずに第三者に提供しません。ただし、次の場合を除きます。",
    ],
    list: [
      "本サイトの運営主体に変更が生じた場合",
      "その他、法律によって合法的に第三者提供が認められている場合",
    ],
  },
  {
    heading: "6. 外部サービス",
    paragraphs: [
      "本サイトはGoogle Maps APIを利用しており、地図表示時にGoogleのサービスが適用されます。",
      "ログイン機能にはGoogle・LINEのOAuthを使用します。",
      "各サービスのプライバシーポリシーも併せてご確認ください。",
    ],
  },
  {
    heading: "7. プライバシーポリシーの変更",
    paragraphs: [
      "本サイトは、必要に応じて本ポリシーの内容を変更することがあります。変更後は、本ページに掲示した時点から効力を持つものとします。",
    ],
  },
  {
    heading: "8. お問い合わせ",
    paragraphs: [
      "お客様の情報の開示、訂正、利用停止、削除をご希望の場合は、GitHubリポジトリのIssueにてご連絡ください。本サイトは個人が運営する非公式のファンサイトであり、事業として個人情報を取り扱うものではないため、ご請求の際は内容確認のためやり取りをお願いする場合があります。",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-14 md:px-12">
      <header className="flex flex-col items-center text-center">
        <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
          プライバシーポリシー / PRIVACY POLICY
        </p>
        <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
          プライバシーポリシー
        </h1>
        <Hairline width={40} className="mt-5" />
        <p className="mt-5 font-serif-jp text-sm leading-[2] text-muted">
          抹茶と神社。の運営者（以下、「当方」という。）は、ユーザーの個人情報について以下のとおりプライバシーポリシー（以下、「本ポリシー」という。）を定めます。
        </p>
      </header>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-mincho text-lg tracking-[0.08em] text-ink border-b border-line pb-2">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-3">
              {section.paragraphs?.map((para, i) => (
                <p key={i} className="font-serif-jp text-sm leading-[2.1] text-ink">
                  {para}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc list-inside space-y-1.5 font-serif-jp text-sm leading-[2.1] text-ink">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 text-right font-sans-jp text-[11px] tracking-[0.1em] text-muted">
        最終更新: 2026年8月
      </p>
    </article>
  );
}

import type { Metadata } from "next";
import Hairline from "@/components/brand/Hairline";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "抹茶と神社。のプライバシーポリシーです。",
};

type Section = { heading: string; body: string | string[] };

const SECTIONS: Section[] = [
  {
    heading: "1. 収集する情報",
    body: [
      "本サイトでは、ユーザーが会員登録・ログインする際にメールアドレスおよびSNSアカウント情報（Twitter / LINE）を取得します。",
      "また、アクセス解析のためにアクセスログ（IPアドレス・閲覧ページ・ブラウザ情報等）を自動的に記録する場合があります。",
    ],
  },
  {
    heading: "2. 情報の利用目的",
    body: [
      "収集した情報は、ログイン認証・お気に入り機能・コメント機能の提供に使用します。",
      "取得した情報を第三者に販売・提供することはありません。",
    ],
  },
  {
    heading: "3. Cookie",
    body: "本サイトはセッション管理のためにCookieを使用します。ブラウザの設定によりCookieを無効化することができますが、一部機能が利用できなくなる場合があります。",
  },
  {
    heading: "4. 外部サービス",
    body: [
      "本サイトはGoogle Maps APIを利用しており、地図表示時にGoogleのサービスが適用されます。Google社のプライバシーポリシーについてはGoogle社のWebサイトをご参照ください。",
      "ログイン機能にはTwitter（X）・LINEのOAuthを使用します。各サービスのプライバシーポリシーも併せてご確認ください。",
    ],
  },
  {
    heading: "5. 情報の管理",
    body: "収集した個人情報は適切な安全対策を講じて管理します。法令に基づく場合を除き、本人の同意なく第三者に開示することはありません。",
  },
  {
    heading: "6. お問い合わせ",
    body: "本ポリシーに関するお問い合わせは、GitHubリポジトリのIssueにてご連絡ください。",
  },
  {
    heading: "7. ポリシーの変更",
    body: "本ポリシーは予告なく変更される場合があります。変更後はサイト上に掲示した時点で効力を持ちます。",
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
          本サイトにおける個人情報の取り扱いについて説明します。
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

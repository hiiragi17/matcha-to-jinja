import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { SiLine } from "react-icons/si";
import Hairline from "@/components/brand/Hairline";
import MockLoginForm from "@/components/auth/MockLoginForm";
import { AVAILABLE_PROVIDERS, auth, signIn } from "@/lib/auth";
import { safeCallbackUrl } from "@/lib/utils/safeCallbackUrl";

export const metadata: Metadata = {
  title: "ログイン",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  // 401 誘導元（LikeButton / CommentSection 等）が付けた callbackUrl を尊重し、
  // ログイン後に元のページへ戻す。検証して外部 URL への誘導は防ぐ。
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center px-6 py-16 text-center">
      <p className="font-sans-jp text-[10px] font-medium tracking-[0.4em] text-olive">
        ログイン / LOGIN
      </p>
      <h1 className="mt-3 font-mincho text-3xl font-semibold tracking-[0.05em] text-ink">
        ログイン
      </h1>
      <Hairline width={40} className="mt-5" />
      <p className="mt-5 max-w-sm font-serif-jp text-sm leading-[2] text-muted">
        お気に入り登録や口コミ投稿には、ログインが必要です。
      </p>

      <div className="mt-10 flex w-full flex-col gap-3">
        {AVAILABLE_PROVIDERS.google ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 border border-line bg-paper px-4 py-3 font-mincho text-[13px] tracking-[0.15em] text-ink transition-opacity hover:opacity-90"
            >
              <FcGoogle aria-hidden="true" className="h-4 w-4" />
              Google でログイン
            </button>
          </form>
        ) : null}

        {AVAILABLE_PROVIDERS.line ? (
          <form
            action={async () => {
              "use server";
              await signIn("line", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 border border-[#06C755] bg-[#06C755] px-4 py-3 font-mincho text-[13px] tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
            >
              <SiLine aria-hidden="true" className="h-4 w-4" />
              LINE でログイン
            </button>
          </form>
        ) : null}

        {AVAILABLE_PROVIDERS.mock ? (
          <div className="mt-2 flex flex-col gap-3 border border-dashed border-line p-5">
            <p className="font-sans-jp text-[10px] tracking-[0.2em] text-muted">
              開発用 / MOCK
            </p>
            <p className="font-serif-jp text-xs leading-[1.8] text-muted">
              OAuth 連携が未設定のためモック用ログインを表示しています。
              Rails JWT 連携（#15）後に本番 OAuth に切り替えます。
            </p>
            <MockLoginForm redirectTo={callbackUrl} />
          </div>
        ) : null}
      </div>

      <p className="mt-10 font-serif-jp text-[11px] leading-[1.8] text-muted">
        ログインすると
        <Link href="/terms" className="mx-1 underline underline-offset-2">
          利用規約
        </Link>
        と
        <Link href="/privacy" className="mx-1 underline underline-offset-2">
          プライバシーポリシー
        </Link>
        に同意したものとみなします。
      </p>
    </section>
  );
}

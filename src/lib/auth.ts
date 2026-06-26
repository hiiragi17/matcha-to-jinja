import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Line from "next-auth/providers/line";
import Google from "next-auth/providers/google";
import {
  exchangeOAuthForJwt,
  revokeJwt,
  type AuthProvider,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const RAILS_AUTH_PROVIDERS = new Set<string>(["google", "line"]);

function isRailsAuthProvider(provider: string): provider is AuthProvider {
  return RAILS_AUTH_PROVIDERS.has(provider);
}

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const lineId = process.env.AUTH_LINE_ID;
const lineSecret = process.env.AUTH_LINE_SECRET;

const hasGoogle = Boolean(googleId && googleSecret);
const hasLine = Boolean(lineId && lineSecret);

// Rails JWT (#15) 未連携の間、OAuth クレデンシャル未設定でも UI を確認できるよう
// Credentials provider を mock として併設する。
// 本番デプロイで OAuth 未設定のまま誰でもログインできてしまわないよう、
// production では一切有効化しない。
const enableMock =
  process.env.NODE_ENV !== "production" &&
  (process.env.NEXT_PUBLIC_USE_MOCK === "true" || (!hasGoogle && !hasLine));

const providers: NextAuthConfig["providers"] = [];

if (hasGoogle) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
}
if (hasLine) {
  providers.push(Line({ clientId: lineId, clientSecret: lineSecret }));
}
if (enableMock) {
  providers.push(
    Credentials({
      id: "mock",
      name: "Mock",
      credentials: {
        name: { label: "表示名", type: "text" },
      },
      async authorize(credentials) {
        const raw = credentials?.name;
        const name =
          typeof raw === "string" && raw.trim().length > 0
            ? raw.trim()
            : "ゲストさん";
        return { id: `mock-${name}`, name, email: null, image: null };
      },
    }),
  );
}

export const AVAILABLE_PROVIDERS = {
  google: hasGoogle,
  line: hasLine,
  mock: enableMock,
} as const;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account?.provider) {
        token.provider = account.provider;
        // モック provider は Rails が無いので、ここで擬似 JWT を発行して
        // apiClient のヘッダ付与経路を本番と統一する（mock/index.ts が Bearer "mock:<id>" を識別）。
        if (account.provider === "mock" && user?.id) {
          // user.id は "mock-<name>" 形式。名前に非 ASCII 文字が含まれる場合
          // Authorization ヘッダが TypeError になるため encodeURIComponent でエスケープする。
          token.railsJwt = `mock:${encodeURIComponent(String(user.id))}`;
          // mock では名前に "admin" を含む場合に admin ロールを付与する（開発・テスト用）。
          token.role = String(user.id).toLowerCase().includes("admin")
            ? "admin"
            : "general";
        } else if (
          isRailsAuthProvider(account.provider) &&
          account.access_token
        ) {
          // OAuth 成功直後だけ access_token が乗ってくる。Rails に渡して
          // Rails 発行の JWT を受け取り、以後の API 呼び出し用に保持する。
          // 失敗時は token.railsJwt を残さずに throw → NextAuth がセッション確立を
          // 中断し、ユーザーは未ログイン状態のまま /auth/login に戻る。
          const authResult = await exchangeOAuthForJwt(
            account.provider,
            {
              access_token: account.access_token,
              uid: account.providerAccountId,
              info: user
                ? {
                    name: user.name ?? undefined,
                    email: user.email ?? undefined,
                    image: user.image ?? undefined,
                  }
                : undefined,
            },
          );
          token.railsJwt = authResult.token;
          token.role = authResult.user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.provider) {
        session.user = {
          ...session.user,
          provider: token.provider,
        };
      }
      if (token.role) {
        session.user = {
          ...session.user,
          role: token.role,
        };
      }
      if (token.railsJwt) {
        session.railsJwt = token.railsJwt;
      }
      return session;
    },
  },
  events: {
    // ログアウト時に Rails の JWT を失効させる。失敗してもクライアント側の
    // セッション破棄は続行する（Rails 側 401 はクライアントには既に無効）。
    async signOut(message) {
      const railsJwt =
        "token" in message ? message.token?.railsJwt : undefined;
      if (!railsJwt || railsJwt.startsWith("mock:")) return;
      try {
        await revokeJwt(railsJwt);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // 既に Rails 側で失効済み。ログとしても残さない。
          return;
        }
        console.warn("[auth] failed to revoke Rails JWT", e);
      }
    },
  },
});

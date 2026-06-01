import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Line from "next-auth/providers/line";
import Twitter from "next-auth/providers/twitter";

const twitterId = process.env.AUTH_TWITTER_ID;
const twitterSecret = process.env.AUTH_TWITTER_SECRET;
const lineId = process.env.AUTH_LINE_ID;
const lineSecret = process.env.AUTH_LINE_SECRET;

const hasTwitter = Boolean(twitterId && twitterSecret);
const hasLine = Boolean(lineId && lineSecret);

// Rails JWT (#15) 未連携の間、OAuth クレデンシャル未設定でも UI を確認できるよう
// Credentials provider を mock として併設する。
// 本番デプロイで OAuth 未設定のまま誰でもログインできてしまわないよう、
// production では一切有効化しない。
const enableMock =
  process.env.NODE_ENV !== "production" &&
  (process.env.NEXT_PUBLIC_USE_MOCK === "true" || (!hasTwitter && !hasLine));

const providers: NextAuthConfig["providers"] = [];

if (hasTwitter) {
  providers.push(Twitter({ clientId: twitterId, clientSecret: twitterSecret }));
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
  twitter: hasTwitter,
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
        // TODO(#15 連携): account.access_token を Rails の
        // POST /api/v1/auth/:provider に渡し、Rails 発行の JWT を token.railsJwt に保存する。
        // モック provider は Rails が無いので、ここで擬似 JWT を発行して
        // apiClient のヘッダ付与経路を本番と統一する（mock/index.ts が Bearer "mock:<id>" を識別）。
        if (account.provider === "mock" && user?.id) {
          token.railsJwt = `mock:${user.id}`;
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
      if (token.railsJwt) {
        session.railsJwt = token.railsJwt;
      }
      return session;
    },
  },
});

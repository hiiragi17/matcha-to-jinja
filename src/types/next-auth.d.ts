import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      provider?: string;
      role?: string;
    };
    railsJwt?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    provider?: string;
    railsJwt?: string;
    // Rails JWT の exp（秒）。切れたらセッションを破棄する判定に使う
    railsJwtExp?: number;
    role?: string;
  }
}

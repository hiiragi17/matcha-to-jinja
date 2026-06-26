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
    role?: string;
  }
}

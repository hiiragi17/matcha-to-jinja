import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";

// next-auth 本体は ESM 解決（next/server）が jsdom 環境で失敗するうえ、
// ここで検証したいのは自前の callbacks / events / provider 構成のみなので、
// NextAuth() と provider ファクトリはテスト用スタブに差し替える。
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: Record<string, unknown>) => ({
    ...config,
    type: "credentials",
  }),
}));

vi.mock("next-auth/providers/google", () => ({
  default: (config: Record<string, unknown>) => ({
    id: "google",
    type: "oauth",
    ...config,
  }),
}));

vi.mock("next-auth/providers/line", () => ({
  default: (config: Record<string, unknown>) => ({
    id: "line",
    type: "oauth",
    ...config,
  }),
}));

const exchangeOAuthForJwt = vi.fn();
const revokeJwt = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  exchangeOAuthForJwt: (...args: unknown[]) => exchangeOAuthForJwt(...args),
  revokeJwt: (...args: unknown[]) => revokeJwt(...args),
}));

type Callbacks = NonNullable<NextAuthConfig["callbacks"]>;
type JwtParams = Parameters<NonNullable<Callbacks["jwt"]>>[0];
type SessionParams = Parameters<NonNullable<Callbacks["session"]>>[0];
type SignOutMessage = Parameters<
  NonNullable<NonNullable<NextAuthConfig["events"]>["signOut"]>
>[0];

type MockCredentialsProvider = {
  id?: string;
  authorize: (
    credentials: Partial<Record<string, unknown>>,
  ) => Promise<{ id: string; name: string } | null>;
};

// env を差し替えたうえでモジュールを再評価する。provider 構成は module scope で
// 決まるため、env ごとに resetModules してから import し直す必要がある。
async function loadAuthModule(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }
  const mod = await import("@/lib/auth");
  // resetModules 後は module graph が作り直されるため、トップレベル import の
  // ApiError とはクラス実体が別になる。instanceof 判定を伴うテストでは
  // 同じ graph の ApiError を使う必要がある。
  const { ApiError: ScopedApiError } = await import("@/lib/api/error");
  return { ...mod, ApiError: ScopedApiError };
}

function oauthAccount(overrides: Record<string, unknown> = {}) {
  return {
    provider: "google",
    providerAccountId: "google-uid-1",
    type: "oauth",
    access_token: "oauth-access-token",
    ...overrides,
  } as NonNullable<JwtParams["account"]>;
}

beforeEach(() => {
  exchangeOAuthForJwt.mockReset();
  revokeJwt.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("authConfig.callbacks.jwt", () => {
  it("account が無い（既存セッションの更新）場合は token を変更しない", async () => {
    const { authConfig } = await loadAuthModule();
    const token = { railsJwt: "existing-jwt", role: "general" };

    const result = await authConfig.callbacks.jwt({ token } as JwtParams);

    expect(result).toEqual({ railsJwt: "existing-jwt", role: "general" });
    expect(exchangeOAuthForJwt).not.toHaveBeenCalled();
  });

  it("mock provider では Rails を呼ばず擬似 JWT と general ロールを付与する", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "mock", access_token: undefined }),
      user: { id: "mock-ゲストさん", name: "ゲストさん" },
    } as JwtParams);

    expect(result.provider).toBe("mock");
    expect(result.railsJwt).toBe(`mock:${encodeURIComponent("mock-ゲストさん")}`);
    expect(result.role).toBe("general");
    expect(exchangeOAuthForJwt).not.toHaveBeenCalled();
  });

  it("mock の擬似 JWT は Authorization ヘッダに載せられる（非 ASCII をエスケープ）", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "mock", access_token: undefined }),
      user: { id: "mock-抹茶太郎" },
    } as JwtParams);

    expect(() =>
      new Headers({ Authorization: `Bearer ${result.railsJwt}` }),
    ).not.toThrow();
    expect(result.railsJwt).not.toContain("抹茶太郎");
  });

  it("mock で id に admin を含む場合は admin ロールになる", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "mock", access_token: undefined }),
      user: { id: "mock-Admin太郎" },
    } as JwtParams);

    expect(result.role).toBe("admin");
  });

  it("mock だが user.id が無い場合は railsJwt を発行しない", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "mock", access_token: undefined }),
    } as JwtParams);

    expect(result.provider).toBe("mock");
    expect(result.railsJwt).toBeUndefined();
    expect(result.role).toBeUndefined();
  });

  it("OAuth 成功時は Rails と JWT を交換し role を保持する", async () => {
    exchangeOAuthForJwt.mockResolvedValue({
      token: "rails-jwt",
      user: { id: 1, name: "抹茶太郎", role: "admin" },
    });
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount(),
      user: {
        id: "google-uid-1",
        name: "抹茶太郎",
        email: "matcha@example.com",
        image: "https://example.com/a.png",
      },
    } as JwtParams);

    expect(exchangeOAuthForJwt).toHaveBeenCalledWith("google", {
      access_token: "oauth-access-token",
      uid: "google-uid-1",
      info: {
        name: "抹茶太郎",
        email: "matcha@example.com",
        image: "https://example.com/a.png",
      },
    });
    expect(result.railsJwt).toBe("rails-jwt");
    expect(result.role).toBe("admin");
    expect(result.provider).toBe("google");
    expect(result.name).toBe("抹茶太郎");
  });

  it("OAuth の表示名と Rails 側の編集済み名前が食い違う場合は Rails 側を優先する（再ログインで OAuth 名に巻き戻る不具合の回帰防止）", async () => {
    exchangeOAuthForJwt.mockResolvedValue({
      token: "rails-jwt",
      user: { id: 1, name: "編集後の名前", role: "general" },
    });
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount(),
      user: {
        id: "google-uid-1",
        name: "Google表示名",
        email: "matcha@example.com",
        image: "https://example.com/a.png",
      },
    } as JwtParams);

    expect(result.name).toBe("編集後の名前");
  });

  it("user が無い OAuth 応答では info を省いて交換する", async () => {
    exchangeOAuthForJwt.mockResolvedValue({
      token: "rails-jwt",
      user: { id: 1, name: "n", role: "general" },
    });
    const { authConfig } = await loadAuthModule();

    await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "line", providerAccountId: "line-1" }),
    } as JwtParams);

    expect(exchangeOAuthForJwt).toHaveBeenCalledWith("line", {
      access_token: "oauth-access-token",
      uid: "line-1",
      info: undefined,
    });
  });

  it("プロフィールが null の user では info の各項目を undefined に落とす", async () => {
    exchangeOAuthForJwt.mockResolvedValue({
      token: "rails-jwt",
      user: { id: 1, name: "n", role: "general" },
    });
    const { authConfig } = await loadAuthModule();

    await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount(),
      user: { id: "google-uid-1", name: null, email: null, image: null },
    } as JwtParams);

    expect(exchangeOAuthForJwt).toHaveBeenCalledWith("google", {
      access_token: "oauth-access-token",
      uid: "google-uid-1",
      info: { name: undefined, email: undefined, image: undefined },
    });
  });

  it("Rails との交換に失敗したら throw し railsJwt を残さない", async () => {
    const { authConfig, ApiError: ScopedApiError } = await loadAuthModule();
    exchangeOAuthForJwt.mockRejectedValue(new ScopedApiError(500, null));
    const token: Record<string, unknown> = {};

    await expect(
      authConfig.callbacks.jwt({
        token,
        account: oauthAccount(),
      } as JwtParams),
    ).rejects.toBeInstanceOf(ScopedApiError);
    expect(token.railsJwt).toBeUndefined();
  });

  it("Rails 連携対象外の provider では交換しない", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ provider: "github" }),
    } as JwtParams);

    expect(exchangeOAuthForJwt).not.toHaveBeenCalled();
    expect(result.provider).toBe("github");
    expect(result.railsJwt).toBeUndefined();
  });

  it("access_token が無い OAuth account では交換しない", async () => {
    const { authConfig } = await loadAuthModule();

    const result = await authConfig.callbacks.jwt({
      token: {},
      account: oauthAccount({ access_token: undefined }),
    } as JwtParams);

    expect(exchangeOAuthForJwt).not.toHaveBeenCalled();
    expect(result.railsJwt).toBeUndefined();
  });

  it("trigger=update かつ session.name があれば token.name を更新する（プロフィール編集後の反映）", async () => {
    const { authConfig } = await loadAuthModule();
    const token = { name: "旧名前", railsJwt: "existing-jwt" };

    const result = await authConfig.callbacks.jwt({
      token,
      trigger: "update",
      session: { name: "新しい名前" },
    } as JwtParams);

    expect(result.name).toBe("新しい名前");
    expect(result.railsJwt).toBe("existing-jwt");
    expect(exchangeOAuthForJwt).not.toHaveBeenCalled();
  });

  it("trigger=update でも session.name が無ければ token.name を変更しない", async () => {
    const { authConfig } = await loadAuthModule();
    const token = { name: "旧名前" };

    const result = await authConfig.callbacks.jwt({
      token,
      trigger: "update",
      session: {},
    } as JwtParams);

    expect(result.name).toBe("旧名前");
  });

  it("trigger=update の session.name は前後の空白を trim し 100 文字に切り詰める（Cookie 肥大化防止）", async () => {
    const { authConfig } = await loadAuthModule();
    const token = { name: "旧名前" };
    const longName = "あ".repeat(150);

    const result = await authConfig.callbacks.jwt({
      token,
      trigger: "update",
      session: { name: `  ${longName}  ` },
    } as JwtParams);

    expect(result.name).toBe(longName.slice(0, 100));
    expect(result.name).toHaveLength(100);
  });

  it("trigger=update の session.name が空白のみなら token.name を変更しない", async () => {
    const { authConfig } = await loadAuthModule();
    const token = { name: "旧名前" };

    const result = await authConfig.callbacks.jwt({
      token,
      trigger: "update",
      session: { name: "   " },
    } as JwtParams);

    expect(result.name).toBe("旧名前");
  });
});

describe("authConfig.callbacks.session", () => {
  it("token の provider / role / railsJwt をセッションに載せる", async () => {
    const { authConfig } = await loadAuthModule();

    const session = await authConfig.callbacks.session({
      session: { user: { name: "抹茶太郎" }, expires: "2099-01-01" },
      token: { provider: "google", role: "admin", railsJwt: "rails-jwt" },
    } as SessionParams);

    expect(session.user.name).toBe("抹茶太郎");
    expect(session.user.provider).toBe("google");
    expect(session.user.role).toBe("admin");
    expect(session.railsJwt).toBe("rails-jwt");
  });

  it("token に何も無ければセッションを変更しない", async () => {
    const { authConfig } = await loadAuthModule();

    const session = await authConfig.callbacks.session({
      session: { user: { name: "抹茶太郎" }, expires: "2099-01-01" },
      token: {},
    } as SessionParams);

    expect(session.user.provider).toBeUndefined();
    expect(session.user.role).toBeUndefined();
    expect(session.railsJwt).toBeUndefined();
  });
});

describe("authConfig.events.signOut", () => {
  it("Rails 発行の JWT は失効させる", async () => {
    revokeJwt.mockResolvedValue(undefined);
    const { authConfig } = await loadAuthModule();

    await authConfig.events.signOut({
      token: { railsJwt: "rails-jwt" },
    } as SignOutMessage);

    expect(revokeJwt).toHaveBeenCalledWith("rails-jwt");
  });

  it("mock の擬似 JWT は Rails に投げない", async () => {
    const { authConfig } = await loadAuthModule();

    await authConfig.events.signOut({
      token: { railsJwt: "mock:mock-guest" },
    } as SignOutMessage);

    expect(revokeJwt).not.toHaveBeenCalled();
  });

  it("token が無い（DB セッション）場合は何もしない", async () => {
    const { authConfig } = await loadAuthModule();

    await authConfig.events.signOut({
      session: { sessionToken: "x" },
    } as SignOutMessage);

    expect(revokeJwt).not.toHaveBeenCalled();
  });

  it("既に失効済み（401）は警告を出さずに握り潰す", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { authConfig, ApiError: ScopedApiError } = await loadAuthModule();
    revokeJwt.mockRejectedValue(new ScopedApiError(401, null));

    await expect(
      authConfig.events.signOut({
        token: { railsJwt: "rails-jwt" },
      } as SignOutMessage),
    ).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("401 以外の失敗は警告のみでログアウトを継続する", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    revokeJwt.mockRejectedValue(new Error("network down"));
    const { authConfig } = await loadAuthModule();

    await expect(
      authConfig.events.signOut({
        token: { railsJwt: "rails-jwt" },
      } as SignOutMessage),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      "[auth] failed to revoke Rails JWT",
      expect.any(Error),
    );
  });
});

describe("provider 構成", () => {
  it("OAuth クレデンシャルが揃っていれば google / line のみ有効", async () => {
    const { AVAILABLE_PROVIDERS, authConfig } = await loadAuthModule({
      AUTH_GOOGLE_ID: "gid",
      AUTH_GOOGLE_SECRET: "gsecret",
      AUTH_LINE_ID: "lid",
      AUTH_LINE_SECRET: "lsecret",
    });

    expect(AVAILABLE_PROVIDERS).toEqual({
      google: true,
      line: true,
      mock: false,
    });
    expect(authConfig.providers).toHaveLength(2);
  });

  it("OAuth 未設定の開発環境では mock provider を併設する", async () => {
    const { AVAILABLE_PROVIDERS, authConfig } = await loadAuthModule({
      AUTH_GOOGLE_ID: undefined,
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_LINE_ID: undefined,
      AUTH_LINE_SECRET: undefined,
    });

    expect(AVAILABLE_PROVIDERS).toEqual({
      google: false,
      line: false,
      mock: true,
    });
    expect(authConfig.providers).toHaveLength(1);
  });

  it("NEXT_PUBLIC_USE_MOCK=true なら OAuth 設定済みでも mock を併設する", async () => {
    const { AVAILABLE_PROVIDERS, authConfig } = await loadAuthModule({
      AUTH_GOOGLE_ID: "gid",
      AUTH_GOOGLE_SECRET: "gsecret",
      NEXT_PUBLIC_USE_MOCK: "true",
    });

    expect(AVAILABLE_PROVIDERS.google).toBe(true);
    expect(AVAILABLE_PROVIDERS.mock).toBe(true);
    expect(authConfig.providers).toHaveLength(2);
  });

  it("production では OAuth 未設定でも mock を有効化しない", async () => {
    const { AVAILABLE_PROVIDERS, authConfig } = await loadAuthModule({
      NODE_ENV: "production",
      NEXT_PUBLIC_USE_MOCK: "true",
      AUTH_GOOGLE_ID: undefined,
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_LINE_ID: undefined,
      AUTH_LINE_SECRET: undefined,
    });

    expect(AVAILABLE_PROVIDERS.mock).toBe(false);
    expect(authConfig.providers).toHaveLength(0);
  });

  it("ID だけ設定されていて secret が無い provider は有効化しない", async () => {
    const { AVAILABLE_PROVIDERS } = await loadAuthModule({
      AUTH_GOOGLE_ID: "gid",
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_LINE_ID: undefined,
      AUTH_LINE_SECRET: undefined,
    });

    expect(AVAILABLE_PROVIDERS.google).toBe(false);
    expect(AVAILABLE_PROVIDERS.line).toBe(false);
  });
});

describe("mock provider の authorize", () => {
  async function loadMockProvider() {
    const { authConfig } = await loadAuthModule({
      AUTH_GOOGLE_ID: undefined,
      AUTH_GOOGLE_SECRET: undefined,
      AUTH_LINE_ID: undefined,
      AUTH_LINE_SECRET: undefined,
    });
    const provider = authConfig.providers.find(
      (p) => (p as unknown as MockCredentialsProvider).id === "mock",
    );
    return provider as unknown as MockCredentialsProvider;
  }

  it("入力された表示名を trim して id / name に使う", async () => {
    const provider = await loadMockProvider();

    await expect(provider.authorize({ name: "  抹茶太郎  " })).resolves.toEqual({
      id: "mock-抹茶太郎",
      name: "抹茶太郎",
      email: null,
      image: null,
    });
  });

  it("表示名が空白のみならゲストさんにフォールバックする", async () => {
    const provider = await loadMockProvider();

    await expect(provider.authorize({ name: "   " })).resolves.toMatchObject({
      id: "mock-ゲストさん",
      name: "ゲストさん",
    });
  });

  it("表示名が未入力でもゲストさんとしてログインできる", async () => {
    const provider = await loadMockProvider();

    await expect(provider.authorize({})).resolves.toMatchObject({
      name: "ゲストさん",
    });
  });
});

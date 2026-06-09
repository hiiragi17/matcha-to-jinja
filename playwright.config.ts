import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// `next dev` を使う必要がある:
// `src/lib/auth.ts` の mock Credentials provider は NODE_ENV !== "production" のときだけ
// 有効化される。`next build && next start` だと NODE_ENV=production になり、
// シナリオ C（mock ログイン）が通らない。
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_MOCK: "true",
      AUTH_SECRET: "test",
      // 認証コールバックの URL 補完にも使われる。
      NEXTAUTH_URL: BASE_URL,
      PORT: String(PORT),
    },
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    // テストは常に実 API パス（MSW で intercept）を経由させる。
    // 開発者の .env.local が NEXT_PUBLIC_USE_MOCK=true でも npm test が
    // モック実装に迂回しないようにし、契約テストの hermetic 性を担保する。
    env: {
      NEXT_PUBLIC_USE_MOCK: "false",
    },
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/*.{test,spec}.{ts,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});

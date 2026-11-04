import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // `eslint .` はビルド成果物も対象にするため明示的に無視する。
  // （旧 `next lint` はこれらを既定で除外していた。）
  globalIgnores([".next/", "out/", "build/", "coverage/", "next-env.d.ts"]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./\\.\\./",
              message:
                "親 2 階層以上を遡る相対 import は禁止。@/* または @tests/* エイリアスを使ってください（CLAUDE.md コーディング規約参照）。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message:
                "親 2 階層以上を遡る相対 import は禁止。@/* または @tests/* エイリアスを使ってください（CLAUDE.md コーディング規約参照）。",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

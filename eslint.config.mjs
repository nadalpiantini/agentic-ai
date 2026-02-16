import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".claude/**",
    ".cache/**",
    ".config/**",
    ".npm/**",
    ".nvm/**",
    ".bun/**",
    "miniforge3/**",
    "Projects/**",
    "Library/**",
    "Documents/**",
    "Downloads/**",
    "Desktop/**",
    "Movies/**",
    "Music/**",
    "Pictures/**",
    "Public/**",
    "Applications/**",
    "dev/**",
    "ai/**",
    "bin/**",
    "go/**",
    "*.md",
    "*.sh",
    "*.txt",
    "*.log",
    "*.png",
    "supabase/**",
  ]),
]);

export default eslintConfig;

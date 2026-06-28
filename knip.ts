import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignoreIssues: {
    "pnpm-workspace.yaml": ["catalog"],
  },
  workspaces: {
    ".": {
      entry: ["caido.config.ts", "vite.config.ts"],
    },
    "packages/backend": {
      project: ["src/**/*.ts"],
      ignoreDependencies: ["caido", "sqlite"],
    },
    "packages/frontend": {
      entry: ["src/index.ts"],
      project: ["src/**/*.{ts,tsx,vue}"],
    },
  },
};

export default config;

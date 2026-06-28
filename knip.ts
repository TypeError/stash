import type { RawConfigurationOrFn } from "knip/dist/types/config.js";

const config: RawConfigurationOrFn = {
  ignoreIssues: {
    "pnpm-workspace.yaml": ["catalog"],
  },
  workspaces: {
    ".": {
      entry: ["caido.config.ts", "vite.config.ts"],
    },
    "packages/backend": {
      entry: ["src/index.ts"],
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

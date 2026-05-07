import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/**",
    "!./**/*.d.ts",
    "!./dist/**",
    "!./node_modules/**",
    "!./**/tsdown.config.ts",
    "!./**/*.test.ts",
    "!./**/*.md",
  ],
  sourcemap: true,
  clean: true,
  dts: true,
  minify: false,
  exports: {
    all: true,
  },
  ignoreWatch: [".turbo"],
  copy: [
    {
      from: "app.plugin.js",
      to: "dist/app.plugin.js",
    },
    {
      from: "package.json",
      to: "dist/package.json",
    },
  ],
});

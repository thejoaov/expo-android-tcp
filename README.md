# expo-reverse-tcp monorepo

This repository contains the publishable `expo-reverse-tcp` Expo config plugin and a demo Expo app used to validate the Android reverse TCP flow locally.

## Workspace layout

- `packages/android-reverse-tcp`: source for the `expo-reverse-tcp` npm package.
- `app/app`: Expo demo app wired to the local workspace package.

## Requirements

- Bun
- Android SDK with `adb`
- A connected Android emulator or device

## Install

```bash
bun install
```

## Main commands

```bash
bun run build
bun run lint
bun run format
bun run test
bun run typecheck
bun run check
bun run android
```

## Tooling

- `turbo` orchestrates workspace tasks from the repo root, so the root scripts no longer rely on `cd app/app` or `cd packages/...` hops.
- `biome` is configured as the shared formatter and linter for the monorepo.
- `lefthook` installs a `pre-commit` hook that formats staged supported files with Biome before each commit is finalized.

## Plugin usage

The demo app configures the plugin in `app/app/app.json`:

```json
[
  "expo-reverse-tcp",
  {
    "ports": [3000, 3001, 3002]
  }
]
```

When the generated Android project runs a local install task such as `installDebug`, the plugin appends Gradle logic that executes:

```bash
adb reverse tcp:{port} tcp:{port}
```

for every configured port before the app launch step continues.

## Package build and publish

The plugin package is built with `tsdown` and emits:

- ESM output
- CommonJS output
- declaration files
- sourcemaps
- minified bundles

CI runs on pushes and pull requests. Publishing is handled by GitHub Actions when a tag matching the package version (for example `v1.0.0`) is pushed.

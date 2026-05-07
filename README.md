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
bun run release
bun run release:dry-run
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
- declaration files
- sourcemaps
- minified bundles

Releases are versioned with `release-it` from the repo root:

```bash
bun run release
```

That command:

- runs the shared root `check` pipeline before changing anything
- bumps `packages/android-reverse-tcp/package.json`
- refreshes `bun.lock`
- creates and pushes a Git commit and tag such as `v1.0.0`

There is also a dedicated GitHub Actions workflow with `workflow_dispatch` for maintainers who prefer releasing from the Actions UI. That workflow runs `release-it`, creates the version commit and tag, and then the publish workflow picks up the pushed `v*` tag.

For non-dry-run releases from GitHub Actions, configure a repository secret named `RELEASE_TOKEN` with permission to push commits and tags. This is required because pushes made with the default `GITHUB_TOKEN` do not trigger the downstream publish workflow.

Publishing is handled by a separate GitHub Actions workflow after the matching tag is pushed, so the repo keeps the established Bun/Turbo/tsdown workflow while gaining a more organized release flow.

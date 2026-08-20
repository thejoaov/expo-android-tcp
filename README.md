# expo-reverse-tcp

Monorepo for the `expo-reverse-tcp` Expo config plugin and its companion demo application.

The project focuses on one job and does it well: making local Android development with Expo less annoying by automatically wiring `adb reverse` for the TCP ports your app needs during local install flows.

## Overview

This repository contains two closely related workspaces:

- the publishable `expo-reverse-tcp` package
- an Expo demo app used to validate the plugin end to end in a real Android project

The plugin injects Android Gradle logic so that, during local install tasks, each configured TCP port is reversed through `adb` before the app launch continues.

## Why this repository exists

Local mobile development often depends on services running on the host machine, such as Metro, local APIs, or mock backends. On Android, that usually means remembering to run a series of `adb reverse` commands manually.

`expo-reverse-tcp` turns that repetitive setup into configuration.

Instead of manually running:

```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:3001 tcp:3001
adb reverse tcp:3002 tcp:3002
```

the plugin generates the necessary Gradle integration from your Expo config.

## How it works

The demo app configures the plugin in `app/app/app.json` like this:

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

for each configured port.

This keeps the setup close to the app configuration instead of scattering one-off shell commands across local development notes or muscle memory.

## Development requirements

To work on this repository locally, you should have:

- Bun
- Android SDK with `adb` available
- an Android emulator or physical Android device for validation

## Getting started

Install dependencies from the repository root:

```bash
bun install
```

## Common commands

All primary workflows are exposed from the repository root.

| Command                   | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `bun run build`           | Builds workspace packages through Turborepo.           |
| `bun run build:plugin`    | Builds only the `expo-reverse-tcp` package.            |
| `bun run lint`            | Runs Biome checks across the repository.               |
| `bun run format`          | Formats the repository with Biome.                     |
| `bun run test`            | Runs package tests through Turborepo.                  |
| `bun run typecheck`       | Runs TypeScript typechecking across workspaces.        |
| `bun run check`           | Runs lint, build, test, and typecheck in sequence.     |
| `bun run android`         | Starts the Android workflow for the demo app.          |
| `bun run android:clean`   | Runs the demo app Android clean workflow.              |
| `bun run start`           | Starts the demo app workspace task.                    |
| `bun run web`             | Runs the demo app web workflow.                        |
| `bun run release`         | Starts the release flow for the publishable package.   |
| `bun run release:dry-run` | Simulates the release flow without publishing changes. |

## Tooling and quality gates

The repository is intentionally organized around a small set of shared tools:

- `turbo` orchestrates workspace-aware tasks from the root
- `biome` provides formatting and linting
- `lefthook` installs the pre-commit hook used for consistent formatting before commits
- `tsdown` builds the publishable plugin package
- `release-it` manages versioning, tagging, and release automation

## Demo app

The Expo demo app exists to validate the plugin against a realistic local development setup. Its configuration lives in `app/app/app.json`, where the plugin is registered and test ports are declared.

This gives the repository a practical feedback loop: the same codebase contains both the distributable plugin and a consumer application used to verify behavior.

## Use the published package

If you only want to consume the plugin in another Expo project, install the package directly. It uses the config plugin APIs from your project's `expo` package, so it is not tied to a specific Expo SDK version:

```bash
npx expo install expo-reverse-tcp
```

Then add it to your Expo config with the ports you need.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-reverse-tcp",
        {
          "ports": [3000, 3001, 3002]
        }
      ]
    ]
  }
}
```

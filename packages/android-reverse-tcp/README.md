# expo-reverse-tcp

`expo-reverse-tcp` is an Expo config plugin that injects Android Gradle logic to run `adb reverse` for a list of configured ports during local Android install flows.

The plugin is not pinned to a specific Expo SDK version. It uses `expo/config-plugins` from the `expo` package already installed in your app.

## Install

```bash
npx expo install expo-reverse-tcp
```

## Usage

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

Set `enabled` to `false` to skip the plugin entirely, including native generation. Ports are not required when it is disabled:

```js
[
  "expo-reverse-tcp",
  {
    enabled: process.env.CI !== "true",
    ports: [3000, 3001, 3002],
  },
]
```

When disabled, the plugin does not inject Gradle and removes any previously generated `adb reverse` block so it does not remain in the Android project.

## Behavior

For each configured port, the plugin generates Gradle code that runs:

```bash
adb reverse tcp:{port} tcp:{port}
```

after a successful local Android install task and before the CLI proceeds to launch the app.

## Package outputs

The published package ships:

- ESM entry points
- generated type declarations
- minified output
- sourcemaps

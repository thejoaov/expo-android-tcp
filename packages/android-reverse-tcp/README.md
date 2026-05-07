# expo-reverse-tcp

`expo-reverse-tcp` is an Expo config plugin that injects Android Gradle logic to run `adb reverse` for a list of configured ports during local Android install flows.

## Install

```bash
bun add expo-reverse-tcp
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

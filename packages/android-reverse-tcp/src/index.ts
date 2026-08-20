import { createRequire } from "node:module";

import type { ConfigPlugin } from "expo/config-plugins";

import { applyGradleBlock, removeGradleBlock } from "./gradle";
import {
  type AndroidReverseTcpPluginProps,
  isPluginEnabled,
  normalizePorts,
} from "./options";

const require = createRequire(import.meta.url);

// CJS require keeps this SDK-agnostic: Expo's `expo/config-plugins` re-export
// is extensionless CJS, which Node ESM cannot resolve without `.js`.
const { createRunOncePlugin, withAppBuildGradle } =
  require("expo/config-plugins") as typeof import("expo/config-plugins");
const pkg = require("../package.json") as {
  name: string;
  version: string;
};

const withAndroidReverseTcp: ConfigPlugin<
  AndroidReverseTcpPluginProps | undefined
> = (config, props) => {
  if (!isPluginEnabled(props)) {
    return withAppBuildGradle(config, (modConfig) => {
      modConfig.modResults.contents = removeGradleBlock(
        modConfig.modResults.contents,
      );
      return modConfig;
    });
  }

  const ports = normalizePorts(props);

  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      throw new Error(
        "[expo-reverse-tcp] Only Groovy Android app build.gradle files are supported.",
      );
    }

    modConfig.modResults.contents = applyGradleBlock(
      modConfig.modResults.contents,
      ports,
    );

    return modConfig;
  });
};

export default createRunOncePlugin(
  withAndroidReverseTcp,
  pkg.name,
  pkg.version,
);
export type { AndroidReverseTcpPluginProps };
export { applyGradleBlock, isPluginEnabled, normalizePorts, removeGradleBlock };

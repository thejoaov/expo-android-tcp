import { createRequire } from "node:module";

import type { ConfigPlugin } from "expo/config-plugins";
import * as configPluginsModule from "expo/config-plugins";

import { applyGradleBlock } from "./gradle";
import { type AndroidReverseTcpPluginProps, normalizePorts } from "./options";

type ConfigPlugins = typeof import("expo/config-plugins") & {
  default?: typeof import("expo/config-plugins");
};

const configPlugins =
  (configPluginsModule as ConfigPlugins).default ??
  (configPluginsModule as typeof import("expo/config-plugins"));

const require = createRequire(import.meta.url);

const { createRunOncePlugin, withAppBuildGradle } = configPlugins;
const pkg = require("../package.json") as {
  name: string;
  version: string;
};

const withAndroidReverseTcp: ConfigPlugin<AndroidReverseTcpPluginProps> = (
  config,
  props,
) => {
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
export { applyGradleBlock, normalizePorts };

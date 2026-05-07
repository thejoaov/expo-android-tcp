import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackageManifest = {
  name?: string;
  private?: boolean;
  version?: string;
};

type PublishOptions = {
  access?: "public" | "restricted";
  allowDirty: boolean;
  dryRun: boolean;
  help: boolean;
  otp?: string;
  registry?: string;
  skipCheck: boolean;
  tag?: string;
};

type CommandResult = {
  output: string;
};

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = join(rootDir, "packages", "android-reverse-tcp");
const packageJsonPath = join(packageDir, "package.json");

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const manifest = readManifest();
  const packageName = getRequiredField(manifest.name, "name");
  const packageVersion = getRequiredField(manifest.version, "version");

  if (manifest.private) {
    throw new Error(
      `Package ${packageName} is marked as private and cannot be published.`,
    );
  }

  if (!options.allowDirty && !options.dryRun) {
    assertCleanWorkingTree();
  }

  const registry = normalizeRegistryUrl(options.registry ?? getNpmRegistry());

  console.log(
    `\n📦 Preparing npm publish for ${packageName}@${packageVersion}`,
  );
  console.log(`   Package dir: ${packageDir}`);
  console.log(`   Registry: ${registry}`);
  console.log(`   Mode: ${options.dryRun ? "dry-run" : "publish"}`);

  if (!options.skipCheck) {
    console.log("\n🧪 Running workspace checks...");
    runCommand("bun", ["run", "check"], { cwd: rootDir });
  }

  console.log("\n🔎 Checking npm registry for an existing release...");
  const publishedVersions = await getPublishedVersions(packageName, registry);

  if (publishedVersions.has(packageVersion)) {
    throw new Error(
      `Version ${packageVersion} of ${packageName} is already published on ${registry}.`,
    );
  }

  if (!options.dryRun) {
    console.log("\n🔐 Verifying npm authentication...");
    runCommand("npm", ["whoami"], { cwd: rootDir });
  }

  const publishArgs = ["publish"];

  if (options.access) {
    publishArgs.push("--access", options.access);
  }

  if (options.tag) {
    publishArgs.push("--tag", options.tag);
  }

  if (options.otp) {
    publishArgs.push("--otp", options.otp);
  }

  if (options.registry) {
    publishArgs.push("--registry", registry);
  }

  if (options.dryRun) {
    publishArgs.push("--dry-run");
  }

  console.log(`\n🚀 Running: npm ${publishArgs.join(" ")}`);
  runCommand("npm", publishArgs, { cwd: packageDir });

  console.log(
    options.dryRun
      ? "\n✅ Dry-run completed successfully."
      : `\n✅ Published ${packageName}@${packageVersion} successfully.`,
  );
}

function parseArgs(args: string[]): PublishOptions {
  const options: PublishOptions = {
    allowDirty: false,
    dryRun: false,
    help: false,
    skipCheck: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case "--allow-dirty":
        options.allowDirty = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      case "--skip-check":
        options.skipCheck = true;
        break;
      case "--access":
        options.access = readEnumArg(args, ++index, arg, [
          "public",
          "restricted",
        ] as const);
        break;
      case "--otp":
        options.otp = readStringArg(args, ++index, arg);
        break;
      case "--registry":
        options.registry = readStringArg(args, ++index, arg);
        break;
      case "--tag":
        options.tag = readStringArg(args, ++index, arg);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function readStringArg(
  args: string[],
  index: number,
  flagName: string,
): string {
  const value = args[index];

  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flagName}.`);
  }

  return value;
}

function readEnumArg<T extends string>(
  args: string[],
  index: number,
  flagName: string,
  values: readonly T[],
): T {
  const value = readStringArg(args, index, flagName) as T;

  if (!values.includes(value)) {
    throw new Error(
      `Invalid value for ${flagName}: ${value}. Expected one of ${values.join(", ")}.`,
    );
  }

  return value;
}

function readManifest(): PackageManifest {
  if (!existsSync(packageJsonPath)) {
    throw new Error(`Could not find package manifest at ${packageJsonPath}.`);
  }

  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as PackageManifest;
}

function getRequiredField(
  value: string | undefined,
  fieldName: string,
): string {
  if (!value) {
    throw new Error(
      `Missing required field \`${fieldName}\` in ${packageJsonPath}.`,
    );
  }

  return value;
}

function assertCleanWorkingTree(): void {
  const result = runCommand("git", ["status", "--short"], {
    captureOutput: true,
    cwd: rootDir,
  });

  if (result.output.trim().length > 0) {
    throw new Error(
      "Working tree has uncommitted changes. Commit or stash them first, or rerun with --allow-dirty.",
    );
  }
}

function getNpmRegistry(): string {
  const result = runCommand("npm", ["config", "get", "registry"], {
    captureOutput: true,
    cwd: rootDir,
  });

  return result.output.trim();
}

function normalizeRegistryUrl(url: string): string {
  if (!url) {
    return "https://registry.npmjs.org/";
  }

  return url.endsWith("/") ? url : `${url}/`;
}

async function getPublishedVersions(
  packageName: string,
  registry: string,
): Promise<Set<string>> {
  const metadataUrl = new URL(encodeURIComponent(packageName), registry);
  const response = await fetch(metadataUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return new Set<string>();
  }

  if (!response.ok) {
    throw new Error(
      `Failed to query npm registry (${response.status} ${response.statusText}) at ${metadataUrl.toString()}.`,
    );
  }

  const metadata = (await response.json()) as {
    versions?: Record<string, unknown>;
  };

  return new Set(Object.keys(metadata.versions ?? {}));
}

function runCommand(
  command: string,
  args: string[],
  options: {
    captureOutput?: boolean;
    cwd: string;
  },
): CommandResult {
  const result = spawnSync(resolveCommand(command), args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: options.captureOutput ? "pipe" : "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(
      stderr && stderr.length > 0
        ? stderr
        : `Command failed: ${command} ${args.join(" ")}`,
    );
  }

  return {
    output: result.stdout ?? "",
  };
}

function resolveCommand(command: string): string {
  if (process.platform === "win32") {
    return `${command}.cmd`;
  }

  return command;
}

function printHelp(): void {
  console.log(`Usage: bun run publish:npm -- [options]

Publishes packages/android-reverse-tcp to the configured npm registry.

Options:
  --dry-run         Run npm publish in dry-run mode
  --skip-check      Skip bun run check before publishing
  --allow-dirty     Allow publishing with local git changes
  --tag <tag>       Publish with a dist-tag, e.g. next
  --otp <code>      Pass an npm OTP code
  --registry <url>  Override the npm registry URL
  --access <mode>   Publish access: public or restricted
  -h, --help        Show this help message
`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n❌ ${message}`);
  process.exitCode = 1;
});

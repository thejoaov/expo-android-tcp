import { describe, expect, it } from "bun:test";

import plugin, {
  applyGradleBlock,
  isPluginEnabled,
  normalizePorts,
  removeGradleBlock,
} from "./index";

describe("isPluginEnabled", () => {
  it("defaults to enabled", () => {
    expect(isPluginEnabled(undefined)).toBe(true);
    expect(isPluginEnabled({ ports: [3000] })).toBe(true);
    expect(isPluginEnabled({ enabled: true, ports: [3000] })).toBe(true);
  });

  it("is disabled only when enabled is false", () => {
    expect(isPluginEnabled({ enabled: false })).toBe(false);
    expect(isPluginEnabled({ enabled: false, ports: [3000] })).toBe(false);
  });
});

describe("normalizePorts", () => {
  it("deduplicates and preserves valid ports", () => {
    expect(normalizePorts({ ports: [3000, 3001, 3000] })).toEqual([3000, 3001]);
  });

  it("throws for a missing ports array", () => {
    expect(() => normalizePorts(undefined)).toThrow(
      "[expo-reverse-tcp] The plugin requires a ports array.",
    );
  });

  it("throws for an invalid port", () => {
    expect(() => normalizePorts({ ports: [0] })).toThrow(
      "must be between 1 and 65535",
    );
  });
});

describe("applyGradleBlock", () => {
  it("appends the generated block when no block exists", () => {
    const source = 'android {\n    namespace "demo"\n}\n';
    const result = applyGradleBlock(source, [3000, 3001]);

    expect(result).toContain("def androidReverseTcpPorts = [3000, 3001]");
    expect(result).toContain('task.name.startsWith("install")');
    expect(result).toContain(
      `commandLine adbExecutable.absolutePath, "reverse", "tcp:\${port}", "tcp:\${port}"`,
    );
  });

  it("replaces the previous generated block", () => {
    const source = [
      "android {",
      '    namespace "demo"',
      "}",
      "",
      "// @generated begin expo-reverse-tcp",
      "def androidReverseTcpPorts = [1111]",
      "// @generated end expo-reverse-tcp",
      "",
    ].join("\n");

    const result = applyGradleBlock(source, [3000, 3001, 3002]);

    expect(result).toContain("def androidReverseTcpPorts = [3000, 3001, 3002]");
    expect(result).not.toContain("def androidReverseTcpPorts = [1111]");
  });

  it("replaces a legacy generated block with the new markers", () => {
    const source = [
      "android {",
      '    namespace "demo"',
      "}",
      "",
      "// @generated begin android-reverse-tcp",
      "def androidReverseTcpPorts = [1111]",
      "// @generated end android-reverse-tcp",
      "",
    ].join("\n");

    const result = applyGradleBlock(source, [3000, 3001, 3002]);

    expect(result).toContain("// @generated begin expo-reverse-tcp");
    expect(result).toContain("def androidReverseTcpPorts = [3000, 3001, 3002]");
    expect(result).not.toContain("// @generated begin android-reverse-tcp");
    expect(result).not.toContain("def androidReverseTcpPorts = [1111]");
  });
});

describe("removeGradleBlock", () => {
  it("leaves source unchanged when no generated block exists", () => {
    const source = 'android {\n    namespace "demo"\n}\n';

    expect(removeGradleBlock(source)).toBe(source);
  });

  it("removes the generated block", () => {
    const source = [
      "android {",
      '    namespace "demo"',
      "}",
      "",
      "// @generated begin expo-reverse-tcp",
      "def androidReverseTcpPorts = [3000]",
      "// @generated end expo-reverse-tcp",
      "",
    ].join("\n");

    const result = removeGradleBlock(source);

    expect(result).toContain('namespace "demo"');
    expect(result).not.toContain("// @generated begin expo-reverse-tcp");
    expect(result).not.toContain("def androidReverseTcpPorts");
  });

  it("removes a legacy generated block", () => {
    const source = [
      "android {",
      '    namespace "demo"',
      "}",
      "",
      "// @generated begin android-reverse-tcp",
      "def androidReverseTcpPorts = [3000]",
      "// @generated end android-reverse-tcp",
      "",
    ].join("\n");

    const result = removeGradleBlock(source);

    expect(result).not.toContain("android-reverse-tcp");
    expect(result).not.toContain("def androidReverseTcpPorts");
  });
});

describe("plugin", () => {
  it("can be disabled without a ports array", () => {
    const config = { name: "demo", slug: "demo" };

    expect(() => plugin(config, { enabled: false })).not.toThrow();
  });

  it("still requires ports when enabled", () => {
    const config = { name: "demo", slug: "demo" };

    expect(() => plugin(config, { enabled: true })).toThrow(
      "The plugin requires a ports array",
    );
  });
});

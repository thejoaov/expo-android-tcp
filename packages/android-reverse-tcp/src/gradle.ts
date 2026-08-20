const PLUGIN_NAME = "expo-reverse-tcp";
const LEGACY_PLUGIN_NAME = "android-reverse-tcp";
const BEGIN_MARKER = `// @generated begin ${PLUGIN_NAME}`;
const END_MARKER = `// @generated end ${PLUGIN_NAME}`;

export function createGradleBlock(ports: number[]): string {
  const gradlePorts = ports.join(", ");

  return [
    `def androidReverseTcpPorts = [${gradlePorts}]`,
    "",
    "gradle.projectsEvaluated {",
    "    tasks.matching { task ->",
    '        task.name.startsWith("install") && !task.name.toLowerCase().contains("androidtest")',
    "    }.configureEach { installTask ->",
    "        installTask.doLast {",
    '            def adbExecutableName = System.getProperty("os.name").toLowerCase().contains("windows") ? "adb.exe" : "adb"',
    `            def adbExecutable = new File(android.sdkDirectory, "platform-tools/\${adbExecutableName}")`,
    "",
    "            if (!adbExecutable.exists()) {",
    `                throw new GradleException("[${PLUGIN_NAME}] Could not find adb at \${adbExecutable.absolutePath}")`,
    "            }",
    "",
    "            androidReverseTcpPorts.each { port ->",
    `                println("[${PLUGIN_NAME}] Running adb reverse for tcp:\${port}")`,
    "                exec {",
    `                    commandLine adbExecutable.absolutePath, "reverse", "tcp:\${port}", "tcp:\${port}"`,
    "                }",
    "            }",
    "        }",
    "    }",
    "}",
  ].join("\n");
}

export function applyGradleBlock(src: string, ports: number[]): string {
  const nextBlock = [BEGIN_MARKER, createGradleBlock(ports), END_MARKER].join(
    "\n",
  );

  for (const blockPattern of generatedBlockPatterns()) {
    if (blockPattern.test(src)) {
      return src.replace(blockPattern, nextBlock);
    }
  }

  return `${src.trimEnd()}\n\n${nextBlock}\n`;
}

export function removeGradleBlock(src: string): string {
  const next = generatedBlockPatterns().reduce(
    (current, pattern) => current.replace(pattern, ""),
    src,
  );

  if (next === src) {
    return src;
  }

  return `${next.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

function generatedBlockPatterns(): RegExp[] {
  return [
    createBlockPattern(BEGIN_MARKER, END_MARKER),
    createBlockPattern(
      `// @generated begin ${LEGACY_PLUGIN_NAME}`,
      `// @generated end ${LEGACY_PLUGIN_NAME}`,
    ),
  ];
}

function createBlockPattern(beginMarker: string, endMarker: string): RegExp {
  return new RegExp(
    `${escapeForRegex(beginMarker)}[\\s\\S]*?${escapeForRegex(endMarker)}`,
    "m",
  );
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

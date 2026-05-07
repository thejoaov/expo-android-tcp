export type AndroidReverseTcpPluginProps = {
  ports: number[];
};

const MIN_PORT = 1;
const MAX_PORT = 65_535;

export function normalizePorts(
  props: AndroidReverseTcpPluginProps | undefined,
): number[] {
  if (!props || !Array.isArray(props.ports)) {
    throw new Error("[expo-reverse-tcp] The plugin requires a ports array.");
  }

  const ports = props.ports.map((port, index) => {
    if (!Number.isInteger(port)) {
      throw new Error(
        `[expo-reverse-tcp] Port at index ${index} must be an integer. Received: ${String(port)}`,
      );
    }

    if (port < MIN_PORT || port > MAX_PORT) {
      throw new Error(
        `[expo-reverse-tcp] Port at index ${index} must be between ${MIN_PORT} and ${MAX_PORT}. Received: ${port}`,
      );
    }

    return port;
  });

  const dedupedPorts = [...new Set(ports)];

  if (dedupedPorts.length === 0) {
    throw new Error(
      "[expo-reverse-tcp] The plugin requires at least one port.",
    );
  }

  return dedupedPorts;
}

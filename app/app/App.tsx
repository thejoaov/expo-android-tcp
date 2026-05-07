import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

type DemoExtra = {
  expoReverseTcpPorts?: number[];
};

export default function App() {
  const ports = ((Constants.expoConfig?.extra as DemoExtra | undefined)
    ?.expoReverseTcpPorts ?? []) as number[];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Expo plugin demo</Text>
        <Text style={styles.title}>Expo Reverse TCP</Text>
        <Text style={styles.description}>
          This app is wired to the local `expo-reverse-tcp` workspace plugin and
          is meant to validate the Android build hook visually.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configured ports</Text>
          {ports.map((port) => (
            <View key={port} style={styles.portCard}>
              <Text style={styles.portLabel}>tcp:{port}</Text>
              <Text style={styles.portCommand}>
                adb reverse tcp:{port} tcp:{port}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to test</Text>
          <Text style={styles.step}>
            1. Start a local server on one of the configured ports.
          </Text>
          <Text style={styles.step}>
            2. Run `bun run android` from the monorepo root.
          </Text>
          <Text style={styles.step}>
            3. Confirm the Android build completes successfully.
          </Text>
          <Text style={styles.step}>
            4. Verify the app launches and the reverse mapping exists through
            `adb reverse --list`.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111827",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  eyebrow: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#f9fafb",
    fontSize: 36,
    fontWeight: "800",
  },
  description: {
    color: "#d1d5db",
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 20,
    fontWeight: "700",
  },
  portCard: {
    borderRadius: 16,
    backgroundColor: "#1f2937",
    padding: 16,
    gap: 6,
  },
  portLabel: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "700",
  },
  portCommand: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "600",
  },
  step: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 22,
  },
});

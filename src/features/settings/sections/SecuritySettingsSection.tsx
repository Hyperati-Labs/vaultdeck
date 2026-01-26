import { Text, View, Switch } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SettingsRow } from "../ui/common/SettingsRow";
import { SegmentedControl } from "../ui/common/SegmentedControl";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useAuthStore } from "../../../state/authStore";

export function SecuritySettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const {
    hasPin,
    autoLockSeconds,
    setAutoLockSeconds,
    biometricAvailable,
    biometricEnabled,
    setBiometricEnabled,
  } = useAuthStore();

  const timeouts = [
    { label: "Instant", value: 0 },
    { label: "30s", value: 30 },
    { label: "1m", value: 60 },
    { label: "5m", value: 300 },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.group}>
        <Link href="/settings/pin" asChild>
          <SettingsRow
            label="Change PIN"
            iconName="keypad-outline"
            rightContent={
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            }
          />
        </Link>

        <View style={styles.divider} />

        <SettingsRow
          label="Biometrics"
          subLabel={
            biometricAvailable ? "Unlock with FaceID/TouchID" : "Not available"
          }
          iconName="finger-print-outline"
          rightContent={
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              disabled={!hasPin || !biometricAvailable}
              trackColor={{
                false: theme.colors.outline,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.surface}
            />
          }
        />

        <View style={styles.divider} />

        <View style={styles.rowColumn}>
          <Text style={styles.rowLabel}>Auto-lock</Text>
          <SegmentedControl
            options={timeouts}
            value={autoLockSeconds}
            onChange={setAutoLockSeconds}
          />
        </View>
      </View>
    </View>
  );
}

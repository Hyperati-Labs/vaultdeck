import { Text, View, Switch } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";

import { SettingsRow } from "../ui/common/SettingsRow";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useAuthStore } from "../../../state/authStore";
import { useSettingsStore } from "../../../state/settingsStore";
import { OptionPickerModal } from "../ui/common/OptionPickerModal";
import { responsiveSpacing } from "../../../utils/responsive";

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
  const { clipboardTimeoutSeconds, setClipboardTimeoutSeconds } =
    useSettingsStore();
  const [autoLockPickerOpen, setAutoLockPickerOpen] = useState(false);
  const [clipboardPickerOpen, setClipboardPickerOpen] = useState(false);

  const timeouts = useMemo(
    () => [
      { label: "Instant", shortLabel: "Instant", value: 0 },
      { label: "30 seconds", shortLabel: "30s", value: 30 },
      { label: "1 minute", shortLabel: "1m", value: 60 },
      { label: "5 minutes", shortLabel: "5m", value: 300 },
    ],
    []
  );

  const currentTimeoutLabel =
    timeouts.find((t) => t.value === autoLockSeconds)?.shortLabel ??
    (autoLockSeconds >= 60
      ? `${Math.floor(autoLockSeconds / 60)}m`
      : `${autoLockSeconds}s`);

  const clipboardTimeouts = useMemo(
    () => [
      { label: "10 seconds", shortLabel: "10s", value: 10 },
      { label: "30 seconds", shortLabel: "30s", value: 30 },
      { label: "1 minute", shortLabel: "1m", value: 60 },
      { label: "5 minutes", shortLabel: "5m", value: 300 },
    ],
    []
  );

  const currentClipboardLabel =
    clipboardTimeouts.find((o) => o.value === clipboardTimeoutSeconds)
      ?.shortLabel ??
    (clipboardTimeoutSeconds >= 60
      ? `${Math.floor(clipboardTimeoutSeconds / 60)}m`
      : `${clipboardTimeoutSeconds}s`);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.group}>
        <Link href="/settings/pin" asChild>
          <SettingsRow
            label="Change PIN"
            iconName="keypad-outline"
            iconColor={theme.colors.accent}
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
          iconName="finger-print-outline"
          iconColor={theme.colors.accent}
          rightContent={
            <View
              style={{
                height: responsiveSpacing(24),
                justifyContent: "center",
              }}
            >
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
            </View>
          }
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Auto-lock"
          iconName="lock-closed-outline"
          subLabel={currentTimeoutLabel}
          iconColor={theme.colors.accent}
          inlineSubLabel
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={() => setAutoLockPickerOpen(true)}
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Clipboard timeout"
          iconName="time-outline"
          subLabel={currentClipboardLabel}
          iconColor={theme.colors.accent}
          inlineSubLabel
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={() => setClipboardPickerOpen(true)}
        />
      </View>

      <OptionPickerModal
        title="Auto-lock"
        visible={autoLockPickerOpen}
        options={timeouts}
        value={autoLockSeconds}
        onSelect={setAutoLockSeconds}
        onClose={() => setAutoLockPickerOpen(false)}
      />

      <OptionPickerModal
        title="Clipboard timeout"
        visible={clipboardPickerOpen}
        options={clipboardTimeouts}
        value={clipboardTimeoutSeconds}
        onSelect={setClipboardTimeoutSeconds}
        onClose={() => setClipboardPickerOpen(false)}
      />
    </View>
  );
}

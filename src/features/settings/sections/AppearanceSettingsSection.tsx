import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useThemeStore, type ThemePreference } from "../../../state/themeStore";
import { ACCENT_LABELS } from "../../../utils/theme";
import { SettingsRow } from "../ui/common/SettingsRow";
import { OptionPickerModal } from "../ui/common/OptionPickerModal";
import { AccentColorPickerModal } from "../ui/common/AccentColorPickerModal";

export function AppearanceSettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { preference, setPreference, accentKey, setAccentKey } =
    useThemeStore();
  const router = useRouter();
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [accentPickerOpen, setAccentPickerOpen] = useState(false);

  const themes: { label: string; value: ThemePreference }[] = [
    { label: "Auto", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  const currentThemeLabel =
    themes.find((t) => t.value === preference)?.label ?? "Auto";
  const currentAccentLabel = ACCENT_LABELS[accentKey] ?? "Amber";

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.group}>
        <SettingsRow
          label="Theme"
          subLabel={currentThemeLabel}
          iconName="contrast-outline"
          iconColor={theme.colors.accent}
          inlineSubLabel
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={() => setThemePickerOpen(true)}
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Accent color"
          subLabel={currentAccentLabel}
          iconName="color-palette-outline"
          iconColor={theme.colors.accent}
          inlineSubLabel
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={() => setAccentPickerOpen(true)}
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Manage Tags"
          iconName="pricetags-outline"
          iconColor={theme.colors.accent}
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={() => router.push("/settings/tags")}
        />
      </View>

      <OptionPickerModal
        title="Theme"
        visible={themePickerOpen}
        options={themes}
        value={preference}
        onSelect={(value: ThemePreference) => setPreference(value)}
        onClose={() => setThemePickerOpen(false)}
      />

      <AccentColorPickerModal
        visible={accentPickerOpen}
        value={accentKey}
        onSelect={setAccentKey}
        onClose={() => setAccentPickerOpen(false)}
      />
    </View>
  );
}

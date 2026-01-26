import { Text, View } from "react-native";

import { SegmentedControl } from "../ui/common/SegmentedControl";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useThemeStore, type ThemePreference } from "../../../state/themeStore";

export function AppearanceSettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { preference, setPreference } = useThemeStore();

  const themes: { label: string; value: ThemePreference }[] = [
    { label: "Auto", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.group}>
        <View style={styles.rowColumn}>
          <Text style={styles.rowLabel}>Theme</Text>
          <SegmentedControl
            options={themes}
            value={preference}
            onChange={(value: ThemePreference) => setPreference(value)}
          />
        </View>
      </View>
    </View>
  );
}

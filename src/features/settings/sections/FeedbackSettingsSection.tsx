import { Text, View, Switch, Platform } from "react-native";

import { SettingsRow } from "../ui/common/SettingsRow";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useSettingsStore } from "../../../state/settingsStore";

export function FeedbackSettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { hapticsEnabled, setHapticsEnabled } = useSettingsStore();
  const hapticsAvailable = Platform.OS !== "ios";

  if (!hapticsAvailable) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Feedback</Text>
      <View style={styles.group}>
        <SettingsRow
          label="Haptics"
          subLabel="Vibration feedback on actions"
          iconName="pulse-outline"
          rightContent={
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{
                false: theme.colors.outline,
                true: theme.colors.accent,
              }}
              thumbColor={theme.colors.surface}
            />
          }
        />
      </View>
    </View>
  );
}

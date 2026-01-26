import { Text, View } from "react-native";

import { SegmentedControl } from "../ui/common/SegmentedControl";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useSettingsStore } from "../../../state/settingsStore";

export function PrivacySettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { clipboardTimeoutSeconds, setClipboardTimeoutSeconds } =
    useSettingsStore();

  const clipboardTimeouts = [
    { label: "10s", value: 10 },
    { label: "30s", value: 30 },
    { label: "1m", value: 60 },
    { label: "5m", value: 300 },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy</Text>
      <View style={styles.group}>
        <View style={styles.rowColumn}>
          <Text style={styles.rowLabel}>Clipboard timeout</Text>
          <SegmentedControl
            options={clipboardTimeouts}
            value={clipboardTimeoutSeconds}
            onChange={setClipboardTimeoutSeconds}
          />
        </View>
      </View>
    </View>
  );
}

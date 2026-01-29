import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import packageJson from "../../../../package.json";

import { SettingsRow } from "../ui/common/SettingsRow";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";

const githubUrl = "https://github.com/Hyperati-Labs/vaultdeck";

export function AboutSettingsSection(_props: any) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.accent}
            />
          </View>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.versionText}>v{packageJson.version}</Text>
        </View>

        <View style={styles.divider} />

        <SettingsRow
          label="GitHub"
          iconName="logo-github"
          iconColor={theme.colors.accent}
          rightContent={
            <Ionicons
              name="open-outline"
              size={18}
              color={theme.colors.accent}
            />
          }
          onPress={() => Linking.openURL(githubUrl)}
        />
      </View>
    </View>
  );
}

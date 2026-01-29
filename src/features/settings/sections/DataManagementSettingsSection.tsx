import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SettingsRow } from "../ui/common/SettingsRow";
import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import type { UseBackupFlowResult } from "../ui/backup/types";

type DataManagementSettingsSectionProps = {
  backupFlow: UseBackupFlowResult;
  onResetPress: () => void;
};

export function DataManagementSettingsSection({
  backupFlow,
  onResetPress,
}: DataManagementSettingsSectionProps) {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);

  const { startExport, startImport } = backupFlow;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data Management</Text>
      <View style={styles.group}>
        <SettingsRow
          label="Export Backup"
          iconName="cloud-download-outline"
          iconColor={theme.colors.accent}
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={startExport}
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Import Backup"
          iconName="cloud-upload-outline"
          iconColor={theme.colors.accent}
          rightContent={
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.muted}
            />
          }
          onPress={startImport}
        />

        <View style={styles.divider} />

        <SettingsRow
          label="Reset Vault"
          iconName="trash-outline"
          onPress={onResetPress}
          rightContent={null}
          labelColor={theme.colors.danger}
          iconColor={theme.colors.danger}
        />
      </View>
    </View>
  );
}

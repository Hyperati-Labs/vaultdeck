import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import BackButton from "../src/components/BackButton";
import Screen from "../src/components/Screen";
import { useBackupFlow } from "../src/features/settings/useBackupFlow";
import { getSettingsStyles } from "../src/features/settings/settingsStyles";
import { useAuthStore } from "../src/state/authStore";
import { useVaultStore } from "../src/state/vaultStore";
import { useTheme } from "../src/utils/useTheme";
import { BackupPasswordModal } from "../src/features/settings/ui/backup/BackupPasswordModal";
import { BackupSuccessModal } from "../src/features/settings/ui/backup/BackupSuccessModal";
import { ConfirmResetModal } from "../src/features/settings/ui/common/ConfirmResetModal";
import { settingsSectionRegistry } from "../src/features/settings/sections";

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { vault, loading, loadVault, resetVault, exportVault, importVault } =
    useVaultStore();
  const { setAutoLockBypass } = useAuthStore();

  const [resetOpen, setResetOpen] = useState(false);

  const backupFlow = useBackupFlow({
    exportVault,
    importVault,
    setAutoLockBypass,
  });

  useEffect(() => {
    if (!vault && !loading) {
      loadVault();
    }
  }, [loadVault, loading, vault]);

  const sections = settingsSectionRegistry.getAll();

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(({ id, component: Section }) => (
          <Section
            key={id}
            backupFlow={backupFlow}
            onResetPress={() => setResetOpen(true)}
          />
        ))}
      </ScrollView>

      <ConfirmResetModal
        visible={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={async () => {
          setResetOpen(false);
          await resetVault();
        }}
      />

      <BackupPasswordModal
        visible={Boolean(backupFlow.backupAction)}
        flow={backupFlow}
        onCancel={backupFlow.cancelBackupAction}
      />

      <BackupSuccessModal
        message={backupFlow.successMessage}
        onDismiss={backupFlow.dismissSuccessMessage}
      />
    </Screen>
  );
}

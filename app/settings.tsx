import {
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { shareAsync } from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import { Linking } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import BackButton from "../src/components/BackButton";
import Screen from "../src/components/Screen";
import { useAuthStore } from "../src/state/authStore";
import { useThemeStore, type ThemePreference } from "../src/state/themeStore";
import { useSettingsStore } from "../src/state/settingsStore";
import { useVaultStore } from "../src/state/vaultStore";
import { useTheme } from "../src/utils/useTheme";
import { logger } from "../src/utils/logger";
import {
  VaultCorruptError,
  VaultPassphraseRequiredError,
} from "../src/storage/vaultStorage";

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const {
    hasPin,
    autoLockSeconds,
    setAutoLockSeconds,
    biometricAvailable,
    biometricEnabled,
    setBiometricEnabled,
    setAutoLockBypass,
  } = useAuthStore();
  const { preference, setPreference } = useThemeStore();
  const {
    hapticsEnabled,
    setHapticsEnabled,
    clipboardTimeoutSeconds,
    setClipboardTimeoutSeconds,
  } = useSettingsStore();
  const hapticsAvailable = Platform.OS !== "ios";
  const { vault, loading, loadVault, resetVault, exportVault, importVault } =
    useVaultStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [backupAction, setBackupAction] = useState<"export" | "import" | null>(
    null
  );
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupPassphraseConfirm, setBackupPassphraseConfirm] = useState("");
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const githubUrl = "https://github.com/dineshkn-dev/vault-deck";
  const backupExtensions = [".vdb", ".blob"];

  const getBackupFilename = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `vault-backup-${stamp}.vdb`;
  };

  const isBackupFile = (pathOrName: string | undefined) => {
    if (!pathOrName) return false;
    const lower = pathOrName.toLowerCase();
    return backupExtensions.some((ext) => lower.endsWith(ext));
  };

  useEffect(() => {
    if (!vault && !loading) {
      loadVault();
    }
  }, [loadVault, loading, vault]);

  const handleExport = async () => {
    setPendingImportUri(null);
    setBackupAction("export");
  };

  const handleImport = async () => {
    setAutoLockBypass(true);
    try {
      const result = await getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!isBackupFile(asset.name ?? asset.uri)) {
        Alert.alert("Import failed", "Please select a VaultDeck backup file.");
        return;
      }

      setPendingImportUri(result.assets[0].uri);
      setBackupAction("import");
    } catch (err) {
      logger.error("Import picker failed", err);
      Alert.alert("Import failed", "Invalid backup file.");
    } finally {
      setAutoLockBypass(false);
    }
  };

  const confirmBackupAction = async () => {
    const trimmed = backupPassphrase.trim();
    if (trimmed.length < 8) {
      Alert.alert("Backup password", "Use at least 8 characters.");
      return;
    }
    if (
      backupAction === "export" &&
      trimmed !== backupPassphraseConfirm.trim()
    ) {
      Alert.alert("Backup password", "Passwords do not match.");
      return;
    }
    try {
      setBackupBusy(true);
      if (backupAction === "export") {
        if (__DEV__) {
          logger.info("Export start", { platform: Platform.OS });
        }
        const path = await exportVault(trimmed);
        if (__DEV__) {
          logger.info("Export path", { path });
        }
        if (Platform.OS === "web") {
          Alert.alert("Export", "Web export not fully supported in this demo.");
          return;
        }
        if (Platform.OS === "android") {
          const info = await FileSystem.getInfoAsync(path);
          if (__DEV__) {
            logger.info("Export file info", {
              exists: info.exists,
              size: info.exists && "size" in info ? info.size : undefined,
            });
          }
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (__DEV__) {
            logger.info("Export SAF permissions", {
              granted: permissions.granted,
            });
          }
          if (!permissions.granted) {
            return;
          }
          const filename = getBackupFilename();
          const fileUri =
            await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              filename,
              "application/octet-stream"
            );
          if (__DEV__) {
            logger.info("Export SAF fileUri", { fileUri });
          }
          const content = await FileSystem.readAsStringAsync(path, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          if (__DEV__) {
            logger.info("Export read content", { length: content.length });
          }
          await FileSystem.writeAsStringAsync(fileUri, content, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          if (__DEV__) {
            logger.info("Export write complete");
          }
          setSuccessMessage("Backup saved.");
          return;
        }
        const filename = getBackupFilename();
        const iosSharePath = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.copyAsync({ from: path, to: iosSharePath });
        try {
          await shareAsync(iosSharePath, {
            UTI: "public.data",
            mimeType: "application/octet-stream",
            dialogTitle: "Save Backup",
          });
        } finally {
          await FileSystem.deleteAsync(iosSharePath, { idempotent: true });
        }
        return;
      }

      if (!pendingImportUri) {
        return;
      }
      await importVault(pendingImportUri, trimmed);
      setSuccessMessage("Backup imported.");
    } catch (err) {
      if (__DEV__) {
        logger.error("Backup action failed", err);
      }
      if (err instanceof VaultPassphraseRequiredError) {
        Alert.alert(
          "Backup password",
          "A password is required to import this backup."
        );
      } else if (err instanceof VaultCorruptError) {
        Alert.alert("Import failed", "Backup file is invalid or corrupted.");
      } else {
        Alert.alert("Import failed", "Incorrect password or invalid backup.");
      }
    } finally {
      setBackupBusy(false);
      setBackupPassphrase("");
      setBackupPassphraseConfirm("");
      setPendingImportUri(null);
      setBackupAction(null);
    }
  };

  const timeouts = [
    { label: "Instant", seconds: 0 },
    { label: "30s", seconds: 30 },
    { label: "1m", seconds: 60 },
    { label: "5m", seconds: 300 },
  ];
  const themes: { label: string; value: ThemePreference }[] = [
    { label: "Auto", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];
  const clipboardTimeouts = [
    { label: "10s", seconds: 10 },
    { label: "30s", seconds: 30 },
    { label: "1m", seconds: 60 },
    { label: "5m", seconds: 300 },
  ];
  const trimmedPassphrase = backupPassphrase.trim();
  const isExportPassphraseValid =
    trimmedPassphrase.length >= 8 &&
    trimmedPassphrase === backupPassphraseConfirm.trim();
  const isImportPassphraseValid = trimmedPassphrase.length >= 8;
  const isBackupActionValid =
    backupAction === "export"
      ? isExportPassphraseValid
      : isImportPassphraseValid;

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.group}>
            <Link href="/settings/pin" asChild>
              <TouchableOpacity style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={theme.colors.ink}
                  />
                </View>
                <Text style={styles.rowLabel}>Change PIN</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            </Link>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={theme.colors.ink}
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Biometrics</Text>
                <Text style={styles.rowSubLabel}>
                  {biometricAvailable
                    ? "Unlock with FaceID/TouchID"
                    : "Not available"}
                </Text>
              </View>
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

            <View style={styles.divider} />

            <View style={styles.rowColumn}>
              <Text style={styles.rowLabel}>Auto-lock</Text>
              <View style={styles.segmentContainer}>
                {timeouts.map((option) => (
                  <TouchableOpacity
                    key={option.seconds}
                    style={[
                      styles.segment,
                      autoLockSeconds === option.seconds &&
                        styles.segmentActive,
                    ]}
                    onPress={() => setAutoLockSeconds(option.seconds)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        autoLockSeconds === option.seconds &&
                          styles.segmentTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.group}>
            <View style={styles.rowColumn}>
              <Text style={styles.rowLabel}>Clipboard timeout</Text>
              <View style={styles.segmentContainer}>
                {clipboardTimeouts.map((option) => (
                  <TouchableOpacity
                    key={option.seconds}
                    style={[
                      styles.segment,
                      clipboardTimeoutSeconds === option.seconds &&
                        styles.segmentActive,
                    ]}
                    onPress={() => setClipboardTimeoutSeconds(option.seconds)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        clipboardTimeoutSeconds === option.seconds &&
                          styles.segmentTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.group}>
            <View style={styles.rowColumn}>
              <Text style={styles.rowLabel}>Theme</Text>
              <View style={styles.segmentContainer}>
                {themes.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.segment,
                      preference === option.value && styles.segmentActive,
                    ]}
                    onPress={() => setPreference(option.value)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        preference === option.value && styles.segmentTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {hapticsAvailable ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <View style={styles.group}>
              <View style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons
                    name="pulse-outline"
                    size={20}
                    color={theme.colors.ink}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Haptics</Text>
                  <Text style={styles.rowSubLabel}>
                    Vibration feedback on actions
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={setHapticsEnabled}
                  trackColor={{
                    false: theme.colors.outline,
                    true: theme.colors.accent,
                  }}
                  thumbColor={theme.colors.surface}
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.group}>
            <TouchableOpacity style={styles.row} onPress={handleExport}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color={theme.colors.ink}
                />
              </View>
              <Text style={styles.rowLabel}>Export Backup</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.row} onPress={handleImport}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color={theme.colors.ink}
                />
              </View>
              <Text style={styles.rowLabel}>Import Backup</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.muted}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => setResetOpen(true)}
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.danger}
                />
              </View>
              <Text style={[styles.rowLabel, { color: theme.colors.danger }]}>
                Reset Vault
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.group}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={theme.colors.ink}
                />
              </View>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => Linking.openURL(githubUrl)}
              accessibilityLabel="Open GitHub repository"
            >
              <View style={styles.rowIcon}>
                <Ionicons
                  name="logo-github"
                  size={20}
                  color={theme.colors.ink}
                />
              </View>
              <Text style={styles.rowLabel}>GitHub</Text>
              <Ionicons
                name="open-outline"
                size={18}
                color={theme.colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={resetOpen} transparent animationType="fade">
        <BlurView intensity={20} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Vault?</Text>
            <Text style={styles.modalBody}>
              This will permanently delete keychains and all data from this
              device. This action cannot be undone unless you have a backup.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setResetOpen(false)}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={async () => {
                  setResetOpen(false);
                  await resetVault();
                }}
              >
                <Text style={styles.modalDangerText}>Reset Everything</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={Boolean(backupAction)} transparent animationType="fade">
        <BlurView intensity={20} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {backupAction === "export"
                ? "Set backup password"
                : "Enter backup password"}
            </Text>
            <Text style={styles.modalBody}>
              {backupAction === "export"
                ? "This password encrypts your backup file."
                : "Enter the password used when the backup was created."}
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={backupPassphrase}
                onChangeText={setBackupPassphrase}
                placeholder="Backup password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                style={styles.input}
              />
            </View>
            {backupAction === "export" ? (
              <View style={styles.inputWrapper}>
                <TextInput
                  value={backupPassphraseConfirm}
                  onChangeText={setBackupPassphraseConfirm}
                  placeholder="Confirm password"
                  placeholderTextColor={theme.colors.muted}
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            ) : null}
            <Text style={styles.helperText}>Minimum 8 characters.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => {
                  if (backupBusy) {
                    return;
                  }
                  setBackupPassphrase("");
                  setBackupPassphraseConfirm("");
                  setPendingImportUri(null);
                  setBackupAction(null);
                }}
                disabled={backupBusy}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDanger,
                  isBackupActionValid ? null : styles.modalDangerDisabled,
                ]}
                onPress={confirmBackupAction}
                disabled={backupBusy || !isBackupActionValid}
              >
                {backupBusy ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <Text
                    style={[
                      styles.modalDangerText,
                      isBackupActionValid
                        ? null
                        : styles.modalDangerTextDisabled,
                    ]}
                  >
                    {backupAction === "export" ? "Create Backup" : "Import"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={Boolean(successMessage)} transparent animationType="fade">
        <BlurView intensity={20} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backup</Text>
            <Text style={styles.modalBody}>{successMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setSuccessMessage(null)}
              >
                <Text style={styles.modalGhostText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </Screen>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
      marginLeft: theme.spacing.xs,
    },
    group: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 56,
      backgroundColor: theme.colors.surface,
    },
    rowColumn: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.md,
    },
    rowIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: "center",
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
    },
    rowSubLabel: {
      fontSize: 12,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginLeft: 56, // Align with text start including icon
    },
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: theme.radius.sm - 2,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentActive: {
      backgroundColor: theme.colors.ink,
    },
    segmentText: {
      fontSize: 13,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      zIndex: 1,
    },
    segmentTextActive: {
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.muted,
      fontFamily: theme.font.regular,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalCard: {
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 10,
    },
    modalTitle: {
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      fontSize: 20,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modalBody: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      fontSize: 15,
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    inputWrapper: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    input: {
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      fontSize: 14,
    },
    helperText: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      fontSize: 12,
      textAlign: "center",
      marginBottom: theme.spacing.md,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    modalGhost: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
    },
    modalGhostText: {
      color: theme.colors.ink,
      fontFamily: theme.font.bold,
    },
    modalDanger: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.danger,
    },
    modalDangerDisabled: {
      backgroundColor: theme.colors.surfaceTint,
    },
    modalDangerText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
    },
    modalDangerTextDisabled: {
      color: theme.colors.muted,
    },
  });

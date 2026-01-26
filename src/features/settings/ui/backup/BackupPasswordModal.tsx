import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { useTheme } from "../../../../utils/useTheme";
import { getSettingsStyles } from "../../settingsStyles";
import type { UseBackupFlowResult } from "./types";

type BackupPasswordModalProps = {
  visible: boolean;
  flow: UseBackupFlowResult;
  onCancel: () => void;
};

export function BackupPasswordModal({
  visible,
  flow,
  onCancel,
}: BackupPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const {
    backupAction,
    backupPassphrase,
    backupPassphraseConfirm,
    backupBusy,
    importWarningAcknowledged,
    isBackupActionValid,
    setBackupPassphrase,
    setBackupPassphraseConfirm,
    toggleImportWarning,
    confirmBackupAction,
  } = flow;

  return (
    <Modal visible={visible} transparent animationType="fade">
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
          {backupAction === "import" ? (
            <View style={styles.warningBox}>
              <View style={styles.warningHeader}>
                <Ionicons
                  name="warning"
                  size={16}
                  color={theme.colors.danger}
                />
                <Text style={styles.warningText}>
                  This will replace all current vault data. Export first if
                  needed.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={toggleImportWarning}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {importWarningAcknowledged ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={theme.colors.accent}
                    />
                  ) : null}
                </View>
                <Text style={styles.checkboxLabel}>
                  I understand this will replace my data
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View
            style={[
              styles.inputWrapper,
              backupAction === "import" &&
                !importWarningAcknowledged &&
                styles.inputWrapperDisabled,
            ]}
          >
            <TextInput
              value={backupPassphrase}
              onChangeText={setBackupPassphrase}
              placeholder="Backup password"
              placeholderTextColor={theme.colors.muted}
              secureTextEntry={!showPassword}
              editable={backupAction === "export" || importWarningAcknowledged}
              style={[
                styles.input,
                backupAction === "import" &&
                  !importWarningAcknowledged &&
                  styles.inputDisabled,
              ]}
            />
            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              disabled={backupAction === "import" && !importWarningAcknowledged}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={
                  backupAction === "import" && !importWarningAcknowledged
                    ? theme.colors.muted
                    : theme.colors.ink
                }
              />
            </TouchableOpacity>
          </View>
          {backupAction === "export" ? (
            <View style={styles.inputWrapper}>
              <TextInput
                value={backupPassphraseConfirm}
                onChangeText={setBackupPassphraseConfirm}
                placeholder="Confirm password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.inputIconButton}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={theme.colors.ink}
                />
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={styles.helperText}>Minimum 8 characters.</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalGhost}
              onPress={onCancel}
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
                    isBackupActionValid ? null : styles.modalDangerTextDisabled,
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
  );
}

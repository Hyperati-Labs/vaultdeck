import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getSettingsStyles } from "../settingsStyles";
import { useTheme } from "../../../utils/useTheme";
import { useVaultStore } from "../../../state/vaultStore";
import { getTagColor } from "../../../utils/tagColors";
import { TagColorPicker } from "../../../components/TagColorPicker";

type RenameState = { source: string; next: string } | null;
type DeleteState = string | null;

export function TagManagerSettingsSection() {
  const theme = useTheme();
  const styles = getSettingsStyles(theme);
  const { vault, setTagColor, renameTag, deleteTag } = useVaultStore();

  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const [renameState, setRenameState] = useState<RenameState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);

  const tagEntries = useMemo(() => {
    const counts: Record<string, number> = {};
    vault?.cards.forEach((card) =>
      card.tags.forEach((t) => {
        const key = t.toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
      })
    );
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [vault]);

  const allTags = useMemo(() => tagEntries.map(([tag]) => tag), [tagEntries]);

  const handleRename = async () => {
    if (!renameState) return;
    await renameTag(renameState.source, renameState.next);
    setRenameState(null);
  };

  const handleDelete = async () => {
    if (!deleteState) return;
    await deleteTag(deleteState);
    setDeleteState(null);
  };

  if (!tagEntries.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.group}>
        <ScrollView
          style={{ maxHeight: 320 }}
          keyboardShouldPersistTaps="handled"
        >
          {tagEntries.map(([tag, count], idx) => {
            const userColor = vault?.tagColors?.[tag];
            const colors = getTagColor(tag, theme, userColor);
            return (
              <View key={tag}>
                <View style={[styles.row, { gap: theme.spacing.sm }]}>
                  <TouchableOpacity
                    onPress={() => setColorTarget(tag)}
                    style={[
                      styles.rowIcon,
                      {
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.bg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    accessibilityLabel={`Set color for ${tag}`}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={18}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={styles.rowLabel}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {tag}
                    </Text>
                    <Text style={styles.rowSubLabel}>
                      {count} {count === 1 ? "card" : "cards"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setRenameState({ source: tag, next: tag.toLowerCase() })
                    }
                    style={{ padding: 8 }}
                    accessibilityLabel={`Rename ${tag}`}
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={theme.colors.ink}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setDeleteState(tag)}
                    style={{ padding: 8 }}
                    accessibilityLabel={`Delete ${tag}`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.colors.danger}
                    />
                  </TouchableOpacity>
                </View>
                {idx < tagEntries.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Color picker */}
      <TagColorPicker
        visible={colorTarget !== null}
        tag={colorTarget}
        currentColor={colorTarget ? vault?.tagColors?.[colorTarget] : undefined}
        onSelect={async (color) => {
          if (!colorTarget) return;
          await setTagColor(colorTarget, color);
          setColorTarget(null);
        }}
        onReset={async () => {
          if (!colorTarget) return;
          await setTagColor(colorTarget, undefined);
          setColorTarget(null);
        }}
        onClose={() => setColorTarget(null)}
      />

      {/* Rename modal */}
      <Modal visible={renameState !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename tag</Text>
            <Text style={styles.modalBody}>
              Change #{renameState?.source} to a new name.
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={renameState?.next ?? ""}
                onChangeText={(t) =>
                  setRenameState((prev) =>
                    prev ? { ...prev, next: t.toLowerCase() } : prev
                  )
                }
                placeholder="new tag name"
                style={styles.input}
                placeholderTextColor={theme.colors.muted}
                autoFocus
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setRenameState(null)}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalDanger,
                  !renameState?.next?.trim() && styles.modalDangerDisabled,
                ]}
                disabled={!renameState?.next?.trim()}
                onPress={handleRename}
              >
                <Text
                  style={[
                    styles.modalDangerText,
                    !renameState?.next?.trim() &&
                      styles.modalDangerTextDisabled,
                  ]}
                >
                  Rename
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete modal */}
      <Modal visible={deleteState !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete tag</Text>
            <Text style={styles.modalBody}>
              Remove #{deleteState} from all cards? This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setDeleteState(null)}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={handleDelete}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

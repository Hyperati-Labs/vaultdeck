import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../../utils/useTheme";
import { useVaultStore } from "../../../state/vaultStore";
import { getTagColor } from "../../../utils/tagColors";
import {
  responsiveFontSize,
  responsiveSpacing,
} from "../../../utils/responsive";
import { TagColorPicker } from "../../../components/TagColorPicker";
import { useHaptics } from "../../../utils/useHaptics";

type RenameState = { source: string; next: string } | null;
type DeleteState = string | null;

export function TagManagerSettingsSection() {
  const theme = useTheme();
  const localStyles = useMemo(() => getLocalStyles(theme), [theme]);
  const { vault, setTagColor, renameTag, deleteTag } = useVaultStore();
  const { impact } = useHaptics();

  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const [renameState, setRenameState] = useState<RenameState>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return tagEntries;
    const query = searchQuery.toLowerCase();
    return tagEntries.filter(([tag]) => tag.includes(query));
  }, [tagEntries, searchQuery]);

  const totalTags = tagEntries.length;
  const totalCards = vault?.cards.length ?? 0;
  const untaggedCards =
    vault?.cards.filter((card) => card.tags.length === 0).length ?? 0;
  const taggedCards = totalCards - untaggedCards;

  const handleRename = async () => {
    if (!renameState) return;
    impact(Haptics.ImpactFeedbackStyle.Medium);
    await renameTag(renameState.source, renameState.next);
    setRenameState(null);
  };

  const handleDelete = async () => {
    if (!deleteState) return;
    impact(Haptics.ImpactFeedbackStyle.Heavy);
    await deleteTag(deleteState);
    setDeleteState(null);
  };

  return (
    <>
      {}
      <View style={localStyles.stickyHeader}>
        {}
        <View style={localStyles.statsContainer}>
          <View style={localStyles.statCard}>
            <Ionicons name="pricetags" size={20} color={theme.colors.accent} />
            <Text style={localStyles.statValue}>{totalTags}</Text>
            <Text style={localStyles.statLabel} numberOfLines={1}>
              Total Tags
            </Text>
          </View>
          <View style={localStyles.statCard}>
            <Ionicons name="card" size={20} color={theme.colors.accent} />
            <Text style={localStyles.statValue}>{taggedCards}</Text>
            <Text style={localStyles.statLabel} numberOfLines={1}>
              Tagged
            </Text>
          </View>
          <View style={localStyles.statCard}>
            <Ionicons
              name="albums-outline"
              size={20}
              color={theme.colors.muted}
            />
            <Text style={localStyles.statValue}>{untaggedCards}</Text>
            <Text style={localStyles.statLabel} numberOfLines={1}>
              Untagged
            </Text>
          </View>
        </View>

        {}
        {tagEntries.length > 0 && (
          <View style={localStyles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.muted}
              style={localStyles.searchIcon}
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tags..."
              placeholderTextColor={theme.colors.muted}
              style={localStyles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={localStyles.searchClear}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {}
      <ScrollView
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={localStyles.tagList}>
          {tagEntries.length === 0 ? (
            <View style={localStyles.emptyState}>
              <View style={localStyles.emptyIconContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={48}
                  color={theme.colors.muted}
                />
              </View>
              <Text style={localStyles.emptyTitle}>No tags yet</Text>
              <Text style={localStyles.emptyMessage}>
                Tags help you organize cards.{"\n"}
                Add tags when creating or editing cards.
              </Text>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={localStyles.noResults}>
              <Ionicons
                name="search-outline"
                size={32}
                color={theme.colors.muted}
              />
              <Text style={localStyles.noResultsText}>
                No tags match "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredEntries.map(([tag, count]) => {
              const userColor = vault?.tagColors?.[tag];
              const colors = getTagColor(tag, theme, userColor);
              return (
                <View key={tag} style={localStyles.tagCard}>
                  <View style={localStyles.tagCardContent}>
                    {}
                    <TouchableOpacity
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setColorTarget(tag);
                      }}
                      style={[
                        localStyles.colorIndicator,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="color-palette"
                        size={16}
                        color={colors.text}
                      />
                    </TouchableOpacity>

                    {}
                    <View style={localStyles.tagInfo}>
                      <Text style={localStyles.tagName} numberOfLines={1}>
                        #{tag}
                      </Text>
                      <Text style={localStyles.tagSubtext}>
                        {count === 1 ? "1 card" : `${count} cards`}
                      </Text>
                    </View>
                  </View>

                  {}
                  <View style={localStyles.tagActions}>
                    <TouchableOpacity
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setRenameState({
                          source: tag,
                          next: tag.toLowerCase(),
                        });
                      }}
                      style={localStyles.actionButton}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={theme.colors.ink}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        setDeleteState(tag);
                      }}
                      style={[
                        localStyles.actionButton,
                        localStyles.deleteButton,
                      ]}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {}
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

      {}
      <Modal visible={renameState !== null} transparent animationType="fade">
        <BlurView intensity={20} style={localStyles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setRenameState(null)}
          />
          <View style={localStyles.modernModal}>
            <View style={localStyles.modalHeader}>
              <View style={localStyles.modalIconContainer}>
                <Ionicons name="create" size={24} color={theme.colors.accent} />
              </View>
              <Text style={localStyles.modernModalTitle}>Rename Tag</Text>
            </View>
            <Text style={localStyles.modernModalBody}>
              Rename{" "}
              <Text style={localStyles.highlight}>#{renameState?.source}</Text>{" "}
              across all cards
            </Text>
            <View style={localStyles.modernInputWrapper}>
              <TextInput
                value={renameState?.next ?? ""}
                onChangeText={(t) =>
                  setRenameState((prev) =>
                    prev ? { ...prev, next: t.toLowerCase() } : prev
                  )
                }
                placeholder="Enter new tag name"
                style={localStyles.modernInput}
                placeholderTextColor={theme.colors.muted}
                autoFocus
                autoCapitalize="none"
              />
            </View>
            <View style={localStyles.modernModalActions}>
              <TouchableOpacity
                style={localStyles.modernActionGhost}
                onPress={() => {
                  impact(Haptics.ImpactFeedbackStyle.Light);
                  setRenameState(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={localStyles.modernActionGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  localStyles.modernActionPrimary,
                  !renameState?.next?.trim() &&
                    localStyles.modernActionDisabled,
                ]}
                disabled={!renameState?.next?.trim()}
                onPress={handleRename}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.surface}
                  style={{ marginRight: 6 }}
                />
                <Text style={localStyles.modernActionPrimaryText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {}
      <Modal visible={deleteState !== null} transparent animationType="fade">
        <BlurView intensity={20} style={localStyles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDeleteState(null)}
          />
          <View style={localStyles.modernModal}>
            <View style={localStyles.modalHeader}>
              <View
                style={[
                  localStyles.modalIconContainer,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(255, 107, 107, 0.15)"
                      : "rgba(176, 0, 32, 0.1)",
                  },
                ]}
              >
                <Ionicons
                  name="warning"
                  size={24}
                  color={theme.colors.danger}
                />
              </View>
              <Text style={localStyles.modernModalTitle}>Delete Tag</Text>
            </View>
            <Text style={localStyles.modernModalBody}>
              Remove{" "}
              <Text
                style={[localStyles.highlight, { color: theme.colors.danger }]}
              >
                #{deleteState}
              </Text>{" "}
              from all cards?
              {"\n"}This action cannot be undone.
            </Text>
            <View style={localStyles.modernModalActions}>
              <TouchableOpacity
                style={localStyles.modernActionGhost}
                onPress={() => {
                  impact(Haptics.ImpactFeedbackStyle.Light);
                  setDeleteState(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={localStyles.modernActionGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={localStyles.modernActionDanger}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash"
                  size={20}
                  color={theme.colors.surface}
                  style={{ marginRight: 6 }}
                />
                <Text style={localStyles.modernActionDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const getLocalStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    stickyHeader: {
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },

    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.xl,
    },

    statsContainer: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: theme.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      minHeight: 70,
    },
    statValue: {
      fontSize: responsiveFontSize(20),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    statLabel: {
      fontSize: responsiveFontSize(10),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "center",
    },

    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    searchIcon: {
      marginRight: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      padding: 0,
    },
    searchClear: {
      padding: 4,
    },

    tagList: {
      gap: theme.spacing.sm,
    },
    tagCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      padding: theme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    tagCardContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    colorIndicator: {
      width: responsiveSpacing(40),
      height: responsiveSpacing(40),
      borderRadius: 12,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    tagInfo: {
      flex: 1,
      gap: 4,
    },
    tagHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    tagName: {
      fontSize: responsiveFontSize(16),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    tagMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tagBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    tagBadgeText: {
      fontSize: responsiveFontSize(12),
      fontFamily: theme.font.bold,
    },
    tagSubtext: {
      fontSize: responsiveFontSize(13),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
    tagActions: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    actionButton: {
      width: responsiveSpacing(36),
      height: responsiveSpacing(36),
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteButton: {
      backgroundColor: theme.isDark
        ? "rgba(255, 107, 107, 0.15)"
        : "rgba(176, 0, 32, 0.08)",
    },

    emptyState: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl * 2,
      paddingHorizontal: theme.spacing.lg,
    },
    emptyIconContainer: {
      width: responsiveSpacing(80),
      height: responsiveSpacing(80),
      borderRadius: 40,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: responsiveFontSize(20),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      marginBottom: theme.spacing.xs,
    },
    emptyMessage: {
      fontSize: responsiveFontSize(14),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      lineHeight: 20,
    },
    noResults: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    noResultsText: {
      fontSize: responsiveFontSize(14),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modernModal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      width: "100%",
      maxWidth: responsiveSpacing(400),
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
    modalHeader: {
      alignItems: "center",
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    modalIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.isDark
        ? "rgba(255, 159, 67, 0.15)"
        : "rgba(208, 123, 47, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    modernModalTitle: {
      fontSize: responsiveFontSize(20),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    modernModalBody: {
      fontSize: responsiveFontSize(14),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: theme.spacing.lg,
    },
    highlight: {
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
    },
    modernInputWrapper: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      marginBottom: theme.spacing.lg,
    },
    modernInput: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    modernModalActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    modernActionGhost: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    modernActionGhostText: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    modernActionPrimary: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    modernActionPrimaryText: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
    modernActionDanger: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    modernActionDangerText: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
    modernActionDisabled: {
      opacity: 0.4,
    },
  });

import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Animated,
  BackHandler,
} from "react-native";

import { AppModal } from "../src/components/AppModal";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useVaultStore } from "../src/state/vaultStore";
import Screen from "../src/components/Screen";
import { useTheme } from "../src/utils/useTheme";
import { Card } from "../src/types/vault";
import { useHaptics } from "../src/utils/useHaptics";
import { getTagColor } from "../src/utils/tagColors";
import { responsiveFontSize, responsiveSpacing } from "../src/utils/responsive";
import CardItem from "../src/components/CardItem";
import SelectionToolbar from "../src/components/SelectionToolbar";
import SearchBar from "../src/components/SearchBar";

export default function Index() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const {
    vault,
    loadVault,
    loading,
    error,
    resetVault,
    upsertCard,
    deleteCards,
    duplicateCards,
    toggleFavoriteCards,
  } = useVaultStore();
  const listRef = useRef<FlatList<Card>>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [query, setQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  const selectionMode = selectedIds.size > 0;

  const router = useRouter();
  const { impact, notify } = useHaptics();

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: searchFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [searchFocused, headerAnim]);

  useEffect(() => {
    if (!vault && !loading && !error) {
      loadVault();
    }
  }, [error, loadVault, loading, vault]);

  useEffect(() => {
    return () => {
      if (snackbarTimer.current) {
        clearTimeout(snackbarTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
      if (searchFocused) {
        setSearchFocused(false);
        setQuery("");
        return true;
      }
      if (selectionMode) {
        setSelectedIds(new Set());
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );

    return () => backHandler.remove();
  }, [searchFocused, selectionMode]);

  const filtered = useMemo(() => {
    if (!vault) {
      return [];
    }
    const q = query.trim().toLowerCase();
    return vault.cards.filter((card) => {
      const matchesQuery =
        !q ||
        card.nickname.toLowerCase().includes(q) ||
        card.issuer.toLowerCase().includes(q) ||
        card.cardholderName.toLowerCase().includes(q);

      const matchesTags =
        tagFilters.length === 0 ||
        tagFilters.every((f) =>
          card.tags.some((t) => t.toLowerCase() === f.toLowerCase())
        );

      return matchesQuery && matchesTags;
    });
  }, [query, tagFilters, vault]);

  const handleLongPress = (card: Card) => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    toggleSelection(card.id);
  };

  const toggleSelection = (id: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    setDeleteOpen(false);
    const count = selectedIds.size;
    await deleteCards(Array.from(selectedIds));
    clearSelection();
    showSnackbar(`Deleted ${count} cards`);
    notify(Haptics.NotificationFeedbackType.Warning);
  };

  const handleBulkDuplicate = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    await duplicateCards(Array.from(selectedIds));
    clearSelection();
    showSnackbar(`Duplicated ${count} card${count > 1 ? "s" : ""}`);
    notify(Haptics.NotificationFeedbackType.Success);
  };

  const handleBulkFavorite = async () => {
    if (selectedIds.size === 0) return;
    await toggleFavoriteCards(Array.from(selectedIds));
    const count = selectedIds.size;
    clearSelection();
    showSnackbar(`Updated ${count} cards`);
    notify(Haptics.NotificationFeedbackType.Success);
  };
  const availableTags = useMemo(() => {
    if (!vault) {
      return [];
    }
    const set = new Set<string>();
    vault.cards.forEach((card) => {
      card.tags.forEach((tag) => {
        if (tag.trim()) {
          set.add(tag.trim());
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [vault]);
  const orderedTags = useMemo(() => {
    const active = tagFilters.filter((t) => availableTags.includes(t));
    const inactive = availableTags.filter((t) => !tagFilters.includes(t));
    return [...active, ...inactive];
  }, [availableTags, tagFilters]);

  const toggleTagFilter = (tag: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
    if (snackbarTimer.current) {
      clearTimeout(snackbarTimer.current);
    }
    snackbarTimer.current = setTimeout(() => {
      setSnackbarVisible(false);
    }, 2500);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  if (error) {
    return (
      <Screen>
        <Text style={styles.title}>Vault needs attention</Text>
        <Text style={styles.subtitle}>
          {error === "missing_key"
            ? "Vault key is missing. Reset to continue."
            : "Vault data looks corrupted. Reset to continue."}
        </Text>
        <TouchableOpacity style={styles.button} onPress={resetVault}>
          <Text style={styles.buttonText}>Reset Vault</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const headerTranslateX = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.headerTitleContainer,
            {
              opacity: headerOpacity,
              transform: [{ translateX: headerTranslateX }],
            },
          ]}
          pointerEvents={searchFocused ? "none" : "auto"}
        >
          <Text style={styles.kicker} numberOfLines={1}>
            Personal vault
          </Text>
          <Text
            style={styles.title}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            VaultDeck
          </Text>
        </Animated.View>

        <View style={styles.headerActions}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {}}
            onCancel={() => {
              setSearchFocused(false);
              setQuery("");
            }}
            isFocused={searchFocused}
          />

          <Animated.View
            style={[styles.headerActionsFade, { opacity: headerOpacity }]}
            pointerEvents={searchFocused ? "none" : "auto"}
          >
            <Link href="/settings" asChild>
              <TouchableOpacity
                style={styles.iconButton}
                accessibilityLabel="Settings"
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={theme.colors.ink}
                />
              </TouchableOpacity>
            </Link>
            <Link href="/card/new" asChild>
              <TouchableOpacity
                style={styles.iconButtonAdd}
                accessibilityLabel="Add card"
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color={theme.colors.accent} />
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </View>
      </View>

      {availableTags.length ? (
        <View style={[styles.quickFilters, searchFocused && { opacity: 0 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFiltersScroll}
          >
            {tagFilters.length > 0 ? (
              <TouchableOpacity
                style={styles.clearChip}
                onPress={() => setTagFilters([])}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color={theme.colors.ink} />
                <Text style={styles.clearChipText}>Clear</Text>
              </TouchableOpacity>
            ) : null}

            {orderedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterChip,
                  (() => {
                    const colors = getTagColor(
                      tag,
                      theme,
                      vault?.tagColors?.[tag]
                    );
                    const active = tagFilters.includes(tag);
                    const dim =
                      tagFilters.length > 0 && !active
                        ? { opacity: 0.7 }
                        : null;
                    return {
                      backgroundColor: tagFilters.includes(tag)
                        ? colors.activeBg
                        : colors.bg,
                      borderColor: tagFilters.includes(tag)
                        ? colors.activeBorder
                        : colors.border,
                      ...dim,
                    };
                  })(),
                  tagFilters.includes(tag) && styles.filterChipActive,
                ]}
                onPress={() => toggleTagFilter(tag)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    (() => {
                      const colors = getTagColor(
                        tag,
                        theme,
                        vault?.tagColors?.[tag]
                      );
                      return {
                        color: tagFilters.includes(tag)
                          ? colors.activeText
                          : colors.text,
                      };
                    })(),
                  ]}
                >
                  {`#${tag.toLowerCase()}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          selectionMode && { paddingBottom: responsiveSpacing(120) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        decelerationRate="normal"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={query ? "search-outline" : "card-outline"}
              size={64}
              color={theme.colors.outline}
            />
            <Text style={styles.emptyTitle}>
              {query ? "No results found" : "No cards yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {query
                ? `We couldn't find any matches for "${query}"`
                : "Add your first card to get started with your vault."}
            </Text>
            {query && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setQuery("")}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <CardItem
            item={item}
            selectionMode={selectionMode}
            selected={selectedIds.has(item.id)}
            onPress={(card) => {
              if (selectionMode) {
                toggleSelection(card.id);
              } else {
                router.push(`/card/${card.id}`);
              }
            }}
            onLongPress={handleLongPress}
            onFavoritePress={(card) => {
              const nextFavorite = !card.favorite;
              impact(Haptics.ImpactFeedbackStyle.Light);
              upsertCard({ ...card, favorite: nextFavorite });
              showSnackbar(
                nextFavorite ? "Moved to favorites" : "Removed from favorites"
              );
            }}
          />
        )}
      />

      <SelectionToolbar
        visible={selectionMode}
        selectedCount={selectedIds.size}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onFavorite={handleBulkFavorite}
        onDuplicate={handleBulkDuplicate}
      />

      <AppModal visible={deleteOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeleteOpen(false)}
        >
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Delete card{selectedIds.size > 1 ? "s" : ""}
            </Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete {selectedIds.size} card
              {selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setDeleteOpen(false)}
              >
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={confirmBulkDelete}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </AppModal>

      {snackbarVisible ? (
        <View style={styles.snackbarContainer} pointerEvents="box-none">
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            {snackbarMessage === "Moved to favorites" ? (
              <TouchableOpacity
                style={styles.snackbarAction}
                onPress={() => {
                  setSnackbarVisible(false);
                  scrollToTop();
                }}
              >
                <Text style={styles.snackbarActionText}>View</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    cardTagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(6),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      alignItems: "center",
      marginBottom: theme.spacing.lg,
      height: responsiveSpacing(50),
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "center",
    },
    headerActionsFade: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "center",
    },
    headerLink: {
      color: theme.colors.ink,
      fontFamily: theme.font.bold,
    },
    kicker: {
      fontFamily: theme.font.bold,
      color: theme.colors.accent,
      fontSize: responsiveFontSize(12),
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    subtitle: {
      color: theme.colors.muted,
      marginTop: theme.spacing.xs,
      maxWidth: responsiveSpacing(240),
      fontFamily: theme.font.regular,
    },
    title: {
      fontSize: responsiveFontSize(28),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      flexShrink: 1,
    },
    list: {
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    cardRow: {
      marginBottom: theme.spacing.md,
    },
    cardGlass: {
      borderRadius: theme.radius.lg,
    },
    cardTitle: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(18),
      color: theme.colors.ink,
      flex: 1,
      minWidth: 0,
    },
    cardMeta: {
      color: theme.colors.muted,
      marginTop: theme.spacing.xs,
      fontFamily: theme.font.regular,
    },
    empty: {
      textAlign: "center",
      color: theme.colors.muted,
      marginTop: theme.spacing.xl,
      fontFamily: theme.font.regular,
    },
    filtersHidden: {
      opacity: 0,
      pointerEvents: "none",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: responsiveSpacing(60),
      paddingHorizontal: theme.spacing.xl,
    },
    emptyTitle: {
      fontSize: responsiveFontSize(20),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
    },
    emptySubtitle: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      lineHeight: responsiveFontSize(22),
      marginBottom: theme.spacing.xl,
    },
    clearSearchButton: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    clearSearchText: {
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(14),
    },
    button: {
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
      alignItems: "center",
    },
    buttonText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
    },
    cardRowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },

    cardFooter: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardFooterText: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
    cardTypePill: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 999,
      paddingVertical: responsiveSpacing(2),
      paddingHorizontal: responsiveSpacing(8),
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(6),
      backgroundColor: theme.colors.surfaceTint,
    },
    cardTypePillText: {
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      fontSize: responsiveFontSize(10),
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    iconButton: {
      width: responsiveSpacing(38),
      height: responsiveSpacing(38),
      borderRadius: responsiveSpacing(19),
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    iconButtonPrimary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    iconButtonAdd: {
      width: responsiveSpacing(38),
      height: responsiveSpacing(38),
      borderRadius: responsiveSpacing(19),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accentSoft,
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },
    quickFilters: {
      marginTop: theme.spacing.sm,
      marginHorizontal: -theme.spacing.lg,
    },
    quickFiltersScroll: {
      paddingHorizontal: theme.spacing.lg,
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "center",
      paddingBottom: responsiveSpacing(4),
    },
    filterChip: {
      paddingVertical: responsiveSpacing(5),
      paddingHorizontal: responsiveSpacing(10),
      borderRadius: responsiveSpacing(16),
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceTint,
      opacity: 1,
    },
    filterChipActive: {
      borderWidth: 1,
      opacity: 1,
    },
    filterChipText: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(13),
      color: theme.colors.ink,
      opacity: 0.8,
      includeFontPadding: false,
    },
    clearChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(4),
      paddingVertical: responsiveSpacing(6),
      paddingHorizontal: responsiveSpacing(12),
      borderRadius: responsiveSpacing(20),
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceTint,
    },
    clearChipText: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(13),
      color: theme.colors.ink,
      includeFontPadding: false,
    },

    snackbarContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    snackbar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
      maxWidth: responsiveSpacing(280),
    },
    snackbarText: {
      color: theme.colors.ink,
      fontFamily: theme.font.regular,
      fontSize: responsiveFontSize(14),
      textAlign: "center",
    },
    snackbarAction: {
      paddingVertical: responsiveSpacing(6),
      paddingHorizontal: responsiveSpacing(10),
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    snackbarActionText: {
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(14),
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: theme.spacing.xl,
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
      fontSize: responsiveFontSize(20),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modalBody: {
      fontSize: responsiveFontSize(15),
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      lineHeight: responsiveFontSize(22),
      marginBottom: theme.spacing.xl,
      textAlign: "center",
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
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
    },
    modalDanger: {
      flex: 1,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      backgroundColor: theme.colors.danger,
    },
    modalDangerText: {
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
  });

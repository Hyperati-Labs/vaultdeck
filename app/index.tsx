import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import GlassPanel from "../src/components/GlassPanel";
import Screen from "../src/components/Screen";
import { useVaultStore } from "../src/state/vaultStore";
import { displayCardNumber } from "../src/utils/cardFormat";
import CardBrandIcon from "../src/components/CardBrandIcon";
import { detectCardType } from "../src/utils/cardType";
import { useTheme } from "../src/utils/useTheme";
import { generateId } from "../src/utils/id";
import { Card } from "../src/types/vault";
import { useHaptics } from "../src/utils/useHaptics";
import { getTagColor } from "../src/utils/tagColors";
import { responsiveFontSize, responsiveSpacing } from "../src/utils/responsive";

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
    deleteCard,
  } = useVaultStore();
  const listRef = useRef<FlatList<Card>>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [query, setQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [longPressedCard, setLongPressedCard] = useState<Card | null>(null);
  const [pressedPosition, setPressedPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const cardRefs = useRef<Record<string, View | null>>({});
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;
  const { impact, notify } = useHaptics();

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

  const handleLongPress = (card: Card, ref: View | null) => {
    if (!ref) return;

    impact(Haptics.ImpactFeedbackStyle.Medium);

    (ref as any).measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        setPressedPosition({ x: pageX, y: pageY, width, height });
        setLongPressedCard(card);
      }
    );
  };

  const handleDuplicate = async () => {
    if (!longPressedCard) return;
    const newId = await generateId();
    const { id, createdAt, updatedAt, ...rest } = longPressedCard;
    await upsertCard({
      ...rest,
      id: newId,
      nickname: `${rest.nickname} (Copy)`,
      createdAt: "",
      updatedAt: "",
    });
    setLongPressedCard(null);
    notify(Haptics.NotificationFeedbackType.Success);
  };

  const handleEdit = () => {
    if (!longPressedCard) return;
    const id = longPressedCard.id;
    setLongPressedCard(null);
    router.push(`/card/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!longPressedCard) return;
    await deleteCard(longPressedCard.id);
    setLongPressedCard(null);
    notify(Haptics.NotificationFeedbackType.Warning);
  };

  const handleToggleFavorite = async () => {
    if (!longPressedCard) return;
    const nextFavorite = !Boolean(longPressedCard.favorite);
    await upsertCard({
      ...longPressedCard,
      favorite: nextFavorite,
    });
    showSnackbar(
      nextFavorite ? "Moved to favorites" : "Removed from favorites"
    );
    setLongPressedCard(null);
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

  return (
    <Screen>
      {!searchFocused ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Personal vault</Text>
            <Text style={styles.title}>VaultDeck</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              accessibilityLabel="Search"
              onPress={() => setSearchFocused(true)}
              activeOpacity={0.6}
            >
              <Ionicons name="search" size={20} color={theme.colors.ink} />
            </TouchableOpacity>
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
          </View>
        </View>
      ) : null}

      {searchFocused ? (
        <GlassPanel style={styles.searchFull}>
          <View style={styles.searchFullRow}>
            <Ionicons name="search" size={18} color={theme.colors.muted} />
            <TextInput
              placeholder="Search cards, issuer, holder"
              placeholderTextColor={theme.colors.muted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              style={styles.searchFullInput}
            />
            <TouchableOpacity
              accessibilityLabel="Close search"
              onPress={() => setSearchFocused(false)}
              activeOpacity={0.6}
            >
              <Ionicons name="close" size={18} color={theme.colors.ink} />
            </TouchableOpacity>
          </View>
        </GlassPanel>
      ) : null}

      {availableTags.length ? (
        <View
          style={[styles.quickFilters, searchFocused && styles.filtersHidden]}
        >
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
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        decelerationRate="normal"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={<Text style={styles.empty}>No cards yet.</Text>}
        renderItem={({ item }) => {
          const cardType = item.cardNumber
            ? detectCardType(item.cardNumber)
            : "unknown";
          const cardTypeLabel =
            cardType === "visa"
              ? "Visa"
              : cardType === "mastercard"
                ? "Mastercard"
                : cardType === "amex"
                  ? "AMEX"
                  : cardType === "discover"
                    ? "Discover"
                    : "Card";

          return (
            <TouchableOpacity
              ref={(ref) => {
                cardRefs.current[item.id] = ref;
              }}
              style={styles.cardRow}
              onPress={() => router.push(`/card/${item.id}`)}
              onLongPress={() =>
                handleLongPress(item, cardRefs.current[item.id])
              }
              delayLongPress={300}
              activeOpacity={0.7}
            >
              <GlassPanel style={styles.cardGlass}>
                <View style={styles.cardRowHeader}>
                  <Text
                    style={styles.cardTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.nickname || "Untitled card"}
                  </Text>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation();
                      const nextFavorite = !item.favorite;
                      impact(Haptics.ImpactFeedbackStyle.Light);
                      upsertCard({ ...item, favorite: nextFavorite });
                      showSnackbar(
                        nextFavorite
                          ? "Moved to favorites"
                          : "Removed from favorites"
                      );
                    }}
                    hitSlop={12}
                    style={styles.cardTagRow}
                    accessibilityLabel={
                      item.favorite ? "Unfavorite" : "Favorite"
                    }
                  >
                    <Ionicons
                      name={item.favorite ? "heart" : "heart-outline"}
                      size={14}
                      color={
                        item.favorite ? theme.colors.accent : theme.colors.muted
                      }
                    />
                  </Pressable>
                </View>
                <Text style={styles.cardMeta}>
                  {item.issuer || "Issuer"} · {displayCardNumber(item)}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {item.expiryMonth}/{item.expiryYear}
                  </Text>
                  <View style={styles.cardTypePill}>
                    <CardBrandIcon type={cardType} size={18} />
                    <Text style={styles.cardTypePillText}>{cardTypeLabel}</Text>
                  </View>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={!!longPressedCard}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setLongPressedCard(null)}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setLongPressedCard(null)}
        >
          <BlurView
            intensity={40}
            tint={theme.isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />

          {pressedPosition && longPressedCard && (
            <View
              style={[
                styles.menuContainer,
                {
                  position: "absolute",
                  top: pressedPosition.y,
                  left: pressedPosition.x,
                  width: pressedPosition.width,
                },
              ]}
            >
              <View
                style={[
                  styles.menuCardPreview,
                  { width: pressedPosition.width },
                ]}
              >
                <GlassPanel style={styles.cardGlass}>
                  <View style={styles.cardRowHeader}>
                    <Text style={styles.cardTitle}>
                      {longPressedCard.nickname || "Untitled card"}
                    </Text>
                    {longPressedCard.favorite ? (
                      <View style={styles.cardTagRow}>
                        <Ionicons
                          name="heart"
                          size={14}
                          color={theme.colors.accent}
                        />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.cardMeta}>
                    {longPressedCard.issuer || "Issuer"} ·{" "}
                    {displayCardNumber(longPressedCard)}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardFooterText}>
                      {longPressedCard.expiryMonth}/{longPressedCard.expiryYear}
                    </Text>
                    <View style={styles.cardTypePill}>
                      <CardBrandIcon
                        type={
                          longPressedCard.cardNumber
                            ? detectCardType(longPressedCard.cardNumber)
                            : "unknown"
                        }
                        size={18}
                      />
                      <Text style={styles.cardTypePillText}>
                        {longPressedCard.cardNumber
                          ? detectCardType(longPressedCard.cardNumber)
                              .charAt(0)
                              .toUpperCase() +
                            detectCardType(longPressedCard.cardNumber).slice(1)
                          : "Card"}
                      </Text>
                    </View>
                  </View>
                </GlassPanel>
              </View>

              <View
                style={[
                  styles.menuOptions,
                  { left: (pressedPosition.width - 250) / 2 },
                  pressedPosition.y > screenHeight / 2
                    ? { bottom: pressedPosition.height + 12 }
                    : { top: pressedPosition.height + 12 },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={handleDuplicate}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuActionContent}>
                    <Text style={styles.menuActionText}>Duplicate</Text>
                    <Ionicons
                      name="copy-outline"
                      size={20}
                      color={theme.colors.ink}
                    />
                  </View>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={handleToggleFavorite}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuActionContent}>
                    <Text style={styles.menuActionText}>
                      {longPressedCard?.favorite ? "Unfavorite" : "Favorite"}
                    </Text>
                    <Ionicons
                      name={
                        longPressedCard?.favorite ? "heart-outline" : "heart"
                      }
                      size={20}
                      color={theme.colors.ink}
                    />
                  </View>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuAction}
                  onPress={handleEdit}
                  activeOpacity={0.8}
                >
                  <View style={styles.menuActionContent}>
                    <Text style={styles.menuActionText}>Edit Card</Text>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={theme.colors.ink}
                    />
                  </View>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={[styles.menuAction, styles.menuActionDanger]}
                  onPress={handleDelete}
                >
                  <View style={styles.menuActionContent}>
                    <Text
                      style={[
                        styles.menuActionText,
                        { color: theme.colors.danger },
                      ]}
                    >
                      Delete
                    </Text>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.colors.danger}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>

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
    },
    headerActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      alignItems: "center",
    },
    searchFull: {
      marginTop: theme.spacing.lg,
    },
    searchFullRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    searchFullInput: {
      flex: 1,
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      paddingVertical: 0,
    },
    filtersHidden: {
      opacity: 0,
      height: 0,
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
      fontSize: responsiveFontSize(30),
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
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
      backgroundColor: theme.isDark
        ? "rgba(208, 123, 47, 0.15)"
        : "rgba(208, 123, 47, 0.1)",
      borderWidth: 1,
      borderColor: theme.isDark
        ? "rgba(208, 123, 47, 0.4)"
        : "rgba(208, 123, 47, 0.3)",
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

    menuBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    menuContainer: {
      gap: theme.spacing.md,
    },
    menuCardPreview: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    menuOptions: {
      position: "absolute",
      width: responsiveSpacing(250),
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
    },
    menuAction: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surface,
    },
    menuActionContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    menuActionText: {
      fontSize: responsiveFontSize(16),
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
    },
    menuActionDanger: {
      borderTopWidth: 0,
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.outline,
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
  });

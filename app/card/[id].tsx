import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

import BackButton from "../../src/components/BackButton";
import Screen from "../../src/components/Screen";
import { useSettingsStore } from "../../src/state/settingsStore";
import { useVaultStore } from "../../src/state/vaultStore";
import {
  displayCardNumber,
  formatFullCardNumber,
} from "../../src/utils/cardFormat";
import { requireSensitiveAuth } from "../../src/utils/sensitiveAuth";
import { useHaptics } from "../../src/utils/useHaptics";
import { useTheme } from "../../src/utils/useTheme";

import VirtualCard from "../../src/components/VirtualCard";

export default function CardDetailScreen() {
  const theme = useTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vault, deleteCard, loadVault, loading } = useVaultStore();
  const clipboardTimeoutSeconds = useSettingsStore(
    (state) => state.clipboardTimeoutSeconds
  );
  const [revealed, setRevealed] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copyNotice, setCopyNotice] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { impact, notify } = useHaptics();

  useEffect(() => {
    if (!vault && !loading) {
      loadVault();
    }
  }, [loadVault, loading, vault]);

  const card = vault?.cards.find((item) => item.id === id);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  if (!card) {
    return (
      <Screen>
        <View style={styles.container}>
          <Text style={styles.muted}>Card not found.</Text>
        </View>
      </Screen>
    );
  }

  const toggleReveal = async () => {
    if (!card.cardNumber) {
      return;
    }
    if (revealed) {
      setRevealed(false);
      return;
    }
    const ok = await requireSensitiveAuth("Reveal card number");
    if (ok) {
      impact(Haptics.ImpactFeedbackStyle.Medium);
      setRevealed(true);
    }
  };

  const handleCopy = async (value: string, sensitive: boolean) => {
    if (sensitive) {
      const ok = await requireSensitiveAuth("Copy card number");
      if (!ok) {
        return;
      }
    }
    await Clipboard.setStringAsync(value);
    impact(Haptics.ImpactFeedbackStyle.Light);
    setCopyNotice(`Copied. Clears in ${clipboardTimeoutSeconds}s.`);
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = setTimeout(() => {
      setCopyNotice("");
    }, 2000);
    if (sensitive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        Clipboard.setStringAsync("");
      }, clipboardTimeoutSeconds * 1000);
    }
  };

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteOpen(false);
    await deleteCard(card.id);
    notify(Haptics.NotificationFeedbackType.Warning);
    router.replace("/");
  };

  const numberToShow =
    revealed && card.cardNumber
      ? formatFullCardNumber(card.cardNumber)
      : displayCardNumber(card);

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(`/card/edit/${card.id}`)}
              style={styles.iconAction}
              accessibilityLabel="Edit card"
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.colors.ink}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.iconAction, styles.iconActionDanger]}
              accessibilityLabel="Delete card"
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.danger}
              />
            </TouchableOpacity>
          </View>
        </View>

        <VirtualCard
          card={card}
          revealed={revealed}
          displayNumber={numberToShow}
        />

        <View style={styles.actionsWrap}>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.subtleButton}
              onPress={toggleReveal}
              disabled={!card.cardNumber}
            >
              <Ionicons
                name={revealed ? "eye-off-outline" : "eye-outline"}
                size={16}
                color={theme.colors.ink}
              />
              <Text style={styles.subtleButtonText}>
                {revealed ? "Hide" : "Reveal"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.subtleButton}
              onPress={() =>
                handleCopy(
                  card.cardNumber ?? card.last4 ?? "",
                  Boolean(card.cardNumber)
                )
              }
              disabled={!card.cardNumber && !card.last4}
            >
              <Ionicons
                name="copy-outline"
                size={16}
                color={theme.colors.ink}
              />
              <Text style={styles.subtleButtonText}>Copy Number</Text>
            </TouchableOpacity>
          </View>
          {copyNotice ? (
            <Text style={styles.copyNotice}>{copyNotice}</Text>
          ) : null}
        </View>

        <View style={styles.infoSection}>
          {card.notes ? (
            <View style={styles.notesContainer}>
              <Text style={styles.sectionHeader}>Notes</Text>
              <Text style={styles.notesText}>{card.notes}</Text>
            </View>
          ) : null}

          {card.tags.length ? (
            <View style={styles.tagsContainer}>
              <Text style={styles.sectionHeader}>Tags</Text>
              <View style={styles.tagRow}>
                {card.tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text
                      style={styles.tagText}
                    >{`#${tag.toLowerCase()}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <Modal visible={deleteOpen} transparent animationType="fade">
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDeleteOpen(false)}
        >
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete card</Text>
            <Text style={styles.modalBody}>
              This will remove the card from your vault. This action cannot be
              undone.
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
                onPress={confirmDelete}
              >
                <Text style={styles.modalDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
    },
    headerActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    iconAction: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
    },
    iconActionDanger: {
      borderColor: theme.colors.danger,
    },
    actionsContainer: {
      flexDirection: "row",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      justifyContent: "center",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    subtleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 110,
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    subtleButtonText: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      opacity: 0.8,
    },
    infoSection: {
      flex: 1,
      paddingHorizontal: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    notesContainer: {
      marginTop: theme.spacing.xl,
    },
    sectionHeader: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    notesText: {
      fontSize: 15,
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
      lineHeight: 22,
      backgroundColor: theme.colors.surfaceTint,
      padding: theme.spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    tagsContainer: {
      marginTop: theme.spacing.xl,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.xs,
    },
    tagPill: {
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceTint,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    tagText: {
      fontSize: 12,
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      opacity: 0.8,
    },
    muted: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      marginTop: 40,
    },
    actionsWrap: {
      position: "relative",
      marginBottom: theme.spacing.md,
    },
    copyNotice: {
      fontSize: 12,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      textAlign: "center",
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -theme.spacing.md,
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
      fontSize: 20,
      fontFamily: theme.font.bold,
      color: theme.colors.ink,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    modalBody: {
      fontSize: 15,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      lineHeight: 22,
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

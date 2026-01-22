import { useMemo, useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import { BlurView } from "expo-blur";
import CardBrandIcon from "./CardBrandIcon";

import type { Card } from "../types/vault";
import { deriveLast4 } from "../utils/cardFormat";
import { detectCardType } from "../utils/cardType";
import { useTheme } from "../utils/useTheme";
import { useHaptics } from "../utils/useHaptics";
import BackButton from "./BackButton";
import { useVaultStore } from "../state/vaultStore";

type CardFormProps = {
  initial?: Partial<Card>;
  showBack?: boolean;
  onSubmit: (payload: {
    nickname: string;
    issuer: string;
    cardholderName: string;
    cardNumber?: string;
    last4?: string;
    expiryMonth: string;
    expiryYear: string;
    notes?: string;
    tags: string[];
  }) => void;
  submitLabel: string;
};

const MIN_NAME_LENGTH = 1;

export default function CardForm({
  initial,
  onSubmit,
  submitLabel,
  showBack = true,
}: CardFormProps) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [cardholderName, setCardholderName] = useState(
    initial?.cardholderName ?? ""
  );
  const [cardNumber, setCardNumber] = useState(initial?.cardNumber ?? "");
  const [expiryDate, setExpiryDate] = useState(
    initial?.expiryMonth && initial?.expiryYear
      ? `${initial.expiryMonth}/${initial.expiryYear}`
      : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.tags ?? []
  );
  const [tagInput, setTagInput] = useState("");
  const storeFullNumber = true;
  const { impact } = useHaptics();

  const { vault } = useVaultStore();
  const allVaultTags = useMemo(() => {
    const set = new Set<string>();
    vault?.cards.forEach((c) =>
      c.tags?.forEach((t) => set.add(t.toLowerCase()))
    );
    return Array.from(set).sort();
  }, [vault]);

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.trim().toLowerCase();
    return allVaultTags.filter(
      (t) => t.includes(input) && !selectedTags.includes(t)
    );
  }, [allVaultTags, tagInput, selectedTags]);

  const navigation = useNavigation();
  const isDirty = useMemo(() => {
    return (
      nickname !== (initial?.nickname ?? "") ||
      issuer !== (initial?.issuer ?? "") ||
      cardholderName !== (initial?.cardholderName ?? "") ||
      cardNumber !== (initial?.cardNumber ?? "") ||
      expiryDate !==
        (initial?.expiryMonth && initial?.expiryYear
          ? `${initial.expiryMonth}/${initial.expiryYear}`
          : "") ||
      notes !== (initial?.notes ?? "") ||
      JSON.stringify(selectedTags) !== JSON.stringify(initial?.tags ?? [])
    );
  }, [
    nickname,
    issuer,
    cardholderName,
    cardNumber,
    expiryDate,
    notes,
    selectedTags,
    initial,
  ]);

  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const isDiscarding = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || isDiscarding.current) {
        return;
      }
      e.preventDefault();
      setPendingAction(e.data.action);
      setDiscardModalVisible(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const canSubmit = useMemo(() => {
    return nickname.trim().length >= MIN_NAME_LENGTH && expiryDate.length === 7;
  }, [expiryDate.length, nickname]);

  const handleExpiryChange = (text: string) => {
    let clean = text.replace(/\//g, "").replace(/\D/g, "");
    if (clean.length > 0) {
      const firstDigit = parseInt(clean[0]);
      if (firstDigit > 1) {
        clean = "0" + clean;
      } else if (clean.length >= 2) {
        const month = parseInt(clean.substring(0, 2));
        if (month > 12) {
          clean = "0" + clean[0];
        } else if (month === 0) {
          clean = "0";
        }
      }
    }
    clean = clean.substring(0, 6);
    let formatted = clean;
    if (clean.length > 2) {
      formatted = clean.substring(0, 2) + "/" + clean.substring(2);
    }
    setExpiryDate(formatted);
  };

  const handleCardNumberChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    setCardNumber(digits);
  };

  const formatCardNumber = (digits: string) => {
    const groups: string[] = [];
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    return groups.join(" ");
  };

  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);

  const [tagInputVisible, setTagInputVisible] = useState(false);
  const tagInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (tagInputVisible) {
      tagInputRef.current?.focus();
    }
  }, [tagInputVisible]);

  const handleTagInput = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.endsWith(",") || lower.endsWith(" ")) {
      const newTag = lower.slice(0, -1).trim();
      if (newTag && !selectedTags.includes(newTag)) {
        impact(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTags([...selectedTags, newTag]);
        setTagInput("");
      } else {
        setTagInput("");
      }
      return;
    }
    setTagInput(text);
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      impact(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput("");
    setTagInputVisible(false);
  };

  const removeTag = (tag: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalTags = [...selectedTags];
    if (tagInput.trim()) {
      const lastTag = tagInput.trim().toLowerCase();
      if (!finalTags.includes(lastTag)) {
        finalTags.push(lastTag);
      }
    }

    const trimmedNumber = cardNumber.trim();
    const storedNumber =
      storeFullNumber && trimmedNumber ? trimmedNumber : undefined;
    const computedLast4 = deriveLast4(trimmedNumber);
    isDiscarding.current = true;
    const [m, y] = expiryDate.split("/");
    onSubmit({
      nickname: nickname.trim(),
      issuer: issuer.trim(),
      cardholderName: cardholderName.trim(),
      cardNumber: storedNumber,
      last4: computedLast4 || undefined,
      expiryMonth: m,
      expiryYear: y,
      notes: notes.trim() || undefined,
      tags: finalTags,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "height" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.stickyHeader}>
        {showBack ? <BackButton /> : <View style={styles.headerSpacer} />}
        <TouchableOpacity
          style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel={submitLabel}
        >
          <Ionicons
            name="checkmark"
            size={24}
            color={canSubmit ? theme.colors.surface : theme.colors.muted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nickname</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                style={styles.input}
                placeholder="e.g. Personal Credit"
                placeholderTextColor={theme.colors.muted + "80"}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Bank Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={issuer}
                onChangeText={setIssuer}
                style={styles.input}
                placeholder="e.g. HDFC Bank"
                placeholderTextColor={theme.colors.muted + "80"}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cardholder Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={cardholderName}
                onChangeText={setCardholderName}
                style={styles.input}
                placeholder="Name as on card"
                placeholderTextColor={theme.colors.muted + "80"}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Card Number</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.cardNumberRow}>
                <TextInput
                  value={formatCardNumber(cardNumber)}
                  onChangeText={handleCardNumberChange}
                  style={[styles.input, styles.cardNumberInput]}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor={theme.colors.muted + "80"}
                  keyboardType="number-pad"
                />
                <View style={styles.cardBrand}>
                  <CardBrandIcon type={cardType} size={18} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Expiry Date</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={expiryDate}
                onChangeText={handleExpiryChange}
                style={styles.input}
                placeholder="MM/YYYY"
                placeholderTextColor={theme.colors.muted + "80"}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <View style={[styles.inputWrapper, styles.notesWrapper]}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.notesInput]}
                placeholder="Optional notes or security details..."
                placeholderTextColor={theme.colors.muted + "80"}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tagsFlow}>
                {selectedTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {tagInputVisible ? (
                  <TextInput
                    ref={tagInputRef}
                    value={tagInput}
                    onChangeText={handleTagInput}
                    onSubmitEditing={() =>
                      tagInput.trim() && addTag(tagInput.trim().toLowerCase())
                    }
                    onBlur={() => {
                      if (!tagInput.trim()) setTagInputVisible(false);
                    }}
                    style={styles.tagInputInline}
                    placeholder="tag name..."
                    placeholderTextColor={theme.colors.muted + "80"}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={() => {
                      impact(Haptics.ImpactFeedbackStyle.Light);
                      setTagInputVisible(true);
                    }}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={theme.colors.accent}
                    />
                    <Text style={styles.addTagButtonText}>Add tag</Text>
                  </TouchableOpacity>
                )}
              </View>

              {tagInputVisible && tagSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tagSuggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionItem}
                        onPress={() => addTag(suggestion)}
                      >
                        <Text style={styles.suggestionText}>#{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={discardModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Discard changes?</Text>
            <Text style={styles.modalBody}>
              You have unsaved changes. Are you sure you want to discard them?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalGhost}
                onPress={() => setDiscardModalVisible(false)}
              >
                <Text style={styles.modalGhostText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={() => {
                  setDiscardModalVisible(false);
                  if (pendingAction) {
                    isDiscarding.current = true;
                    navigation.dispatch(pendingAction);
                  }
                }}
              >
                <Text style={styles.modalDangerText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      paddingBottom: theme.spacing.xl * 2,
    },
    stickyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    headerSpacer: {
      width: 40,
    },
    saveButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.surfaceTint,
      opacity: 0.5,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontFamily: theme.font.bold,
      fontSize: 12,
      color: theme.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: theme.spacing.md,
      marginLeft: 4,
    },
    field: {
      marginBottom: theme.spacing.lg,
    },
    fieldHalf: {
      flex: 1,
    },
    label: {
      fontFamily: theme.font.bold,
      fontSize: 13,
      color: theme.colors.muted,
      marginBottom: theme.spacing.xs,
      marginLeft: 4,
    },
    inputWrapper: {
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: 16,
      overflow: "hidden",
    },
    notesWrapper: {
      paddingVertical: 12,
    },
    input: {
      paddingVertical: 14,
      color: theme.colors.ink,
      fontFamily: theme.font.regular,
      fontSize: 16,
    },
    cardNumberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    cardNumberInput: {
      flex: 1,
    },
    cardBrand: {
      width: 32,
      height: 24,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    labelLowercase: {
      fontFamily: theme.font.bold,
      fontSize: 13,
      color: theme.colors.muted,
      marginBottom: theme.spacing.sm,
      marginLeft: 4,
    },
    notesInput: {
      minHeight: 100,
      textAlignVertical: "top",
      paddingTop: 0,
    },
    tagsContainer: {
      minHeight: 44,
      paddingHorizontal: 4,
      marginTop: 4,
    },
    tagsFlow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
    },
    tagChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    tagChipText: {
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.ink,
      lineHeight: 18,
      includeFontPadding: false,
    },
    addTagButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceTint,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    addTagButtonText: {
      fontFamily: theme.font.bold,
      fontSize: 14,
      color: theme.colors.accent,
      lineHeight: 18,
      includeFontPadding: false,
    },
    tagInputInline: {
      minWidth: 100,
      paddingVertical: 8,
      paddingHorizontal: 14,
      color: theme.colors.ink,
      fontFamily: theme.font.regular,
      fontSize: 15,
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      includeFontPadding: false,
    },
    suggestions: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    suggestionItem: {
      backgroundColor: theme.colors.surface,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    suggestionText: {
      fontFamily: theme.font.regular,
      fontSize: 13,
      color: theme.colors.muted,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalSheet: {
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
    modalDangerText: {
      color: theme.colors.surface,
      fontFamily: theme.font.bold,
    },
  });

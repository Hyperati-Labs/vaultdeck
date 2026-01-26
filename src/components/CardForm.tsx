import { useMemo as reactUseMemo } from "react";
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
import { BlurView } from "expo-blur";
import CardBrandIcon from "./CardBrandIcon";

import type { Card } from "../types/vault";
import { deriveLast4 } from "../utils/cardFormat";
import { detectCardType } from "../utils/cardType";
import { useTheme } from "../utils/useTheme";
import { useHaptics } from "../utils/useHaptics";
import BackButton from "./BackButton";
import { useVaultStore } from "../state/vaultStore";
import { useCardFormatting } from "./CardForm/hooks/useCardFormatting";
import { useCardFormState } from "./CardForm/hooks/useCardFormState";
import { useCardValidation } from "./CardForm/hooks/useCardValidation";
import { useCardTags } from "./CardForm/hooks/useCardTags";
import { useDiscardWarning } from "./CardForm/hooks/useDiscardWarning";
import { getCardFormStyles } from "./CardForm/cardFormStyles";

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

const storeFullNumber = true;

export default function CardForm({
  initial,
  onSubmit,
  submitLabel,
  showBack = true,
}: CardFormProps) {
  const theme = useTheme();
  const styles = getCardFormStyles(theme);

  // Use extracted hooks for form state management
  const formState = useCardFormState(initial);
  const { vault } = useVaultStore();
  const tags = useCardTags(initial?.tags, vault ?? undefined);
  const validation = useCardValidation(formState, initial);
  const discard = useDiscardWarning(validation.isDirty);
  const formatting = useCardFormatting();
  const { impact } = useHaptics();

  // Detect card type from card number
  const cardType = reactUseMemo(
    () => detectCardType(formState.cardNumber),
    [formState.cardNumber]
  );

  // Handle form submission
  const handleSubmit = () => {
    if (!validation.canSubmit) return;
    const finalTags = [...tags.selectedTags];
    if (tags.tagInput.trim()) {
      const lastTag = tags.tagInput.trim().toLowerCase();
      if (!finalTags.includes(lastTag)) {
        finalTags.push(lastTag);
      }
    }

    const trimmedNumber = formState.cardNumber.trim();
    const storedNumber =
      storeFullNumber && trimmedNumber ? trimmedNumber : undefined;
    const computedLast4 = deriveLast4(trimmedNumber);
    discard.isDiscarding.current = true;
    const [m, y] = formState.expiryDate.split("/");
    onSubmit({
      nickname: formState.nickname.trim(),
      issuer: formState.issuer.trim(),
      cardholderName: formState.cardholderName.trim(),
      cardNumber: storedNumber,
      last4: computedLast4 || undefined,
      expiryMonth: m,
      expiryYear: y,
      notes: formState.notes.trim() || undefined,
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
          style={[
            styles.saveButton,
            !validation.canSubmit && styles.saveButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validation.canSubmit}
          accessibilityLabel={submitLabel}
        >
          <Ionicons
            name="checkmark"
            size={24}
            color={
              validation.canSubmit ? theme.colors.surface : theme.colors.muted
            }
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
                value={formState.nickname}
                onChangeText={formState.setNickname}
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
                value={formState.issuer}
                onChangeText={formState.setIssuer}
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
                value={formState.cardholderName}
                onChangeText={formState.setCardholderName}
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
                  value={formatting.formatCardNumberForDisplay(
                    formState.cardNumber
                  )}
                  onChangeText={(value) => {
                    const formatted = formatting.handleCardNumberChange(value);
                    formState.setCardNumber(formatted);
                  }}
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
                value={formState.expiryDate}
                onChangeText={(text) => {
                  const formatted = formatting.handleExpiryChange(text);
                  formState.setExpiryDate(formatted);
                }}
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
                value={formState.notes}
                onChangeText={formState.setNotes}
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
                {tags.selectedTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        impact(Haptics.ImpactFeedbackStyle.Light);
                        tags.removeTag(tag);
                      }}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {tags.tagInputVisible ? (
                  <TextInput
                    ref={tags.tagInputRef}
                    value={tags.tagInput}
                    onChangeText={tags.handleTagInput}
                    onSubmitEditing={() =>
                      tags.tagInput.trim() &&
                      tags.addTag(tags.tagInput.trim().toLowerCase())
                    }
                    onBlur={() => {
                      if (!tags.tagInput.trim()) tags.setTagInputVisible(false);
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
                      tags.setTagInputVisible(true);
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

              {tags.tagInputVisible && tags.tagSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tags.tagSuggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionItem}
                        onPress={() => {
                          impact(Haptics.ImpactFeedbackStyle.Light);
                          tags.addTag(suggestion);
                        }}
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

      <Modal
        visible={discard.discardModalVisible}
        transparent
        animationType="fade"
      >
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
                onPress={discard.cancelDiscard}
              >
                <Text style={styles.modalGhostText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDanger}
                onPress={discard.confirmDiscard}
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

/**
 * useCardTags Hook
 * Manages tag selection, input, and autocomplete suggestions
 * Extracted from CardForm component for reusability
 */

import { useMemo, useState, useEffect, useRef } from "react";
import { TextInput } from "react-native";
import type { VaultData } from "../../../types/vault";

/**
 * Hook that provides tag management for card form
 * @param initial - Initial selected tags
 * @param vault - Vault data containing all cards for tag suggestions
 * @returns Tag state and handlers
 */
export function useCardTags(initial?: string[], vault?: VaultData) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initial ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagInputVisible, setTagInputVisible] = useState(false);
  const tagInputRef = useRef<TextInput>(null);

  /**
   * Get all tags from vault cards, deduplicated and sorted
   */
  const allVaultTags = useMemo(() => {
    const set = new Set<string>();
    vault?.cards.forEach((c) =>
      c.tags?.forEach((t) => set.add(t.toLowerCase()))
    );
    return Array.from(set).sort();
  }, [vault]);

  /**
   * Get filtered suggestions matching current input
   * Excludes already selected tags
   */
  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.trim().toLowerCase();
    return allVaultTags.filter(
      (t: string) => t.includes(input) && !selectedTags.includes(t)
    );
  }, [allVaultTags, tagInput, selectedTags]);

  /**
   * Auto-focus tag input when it becomes visible
   */
  useEffect(() => {
    if (tagInputVisible) {
      tagInputRef.current?.focus();
    }
  }, [tagInputVisible]);

  /**
   * Handle tag input changes
   * Auto-add tag if input ends with comma or space
   */
  const handleTagInput = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.endsWith(",") || lower.endsWith(" ")) {
      const newTag = lower.slice(0, -1).trim();
      if (newTag && !selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput("");
      } else {
        setTagInput("");
      }
      return;
    }
    setTagInput(text);
  };

  /**
   * Add a tag to selected tags
   */
  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput("");
    setTagInputVisible(false);
  };

  /**
   * Remove a tag from selected tags
   */
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t: string) => t !== tag));
  };

  return {
    selectedTags,
    setSelectedTags,
    tagInput,
    setTagInput,
    tagInputVisible,
    setTagInputVisible,
    tagInputRef,
    allVaultTags,
    tagSuggestions,
    handleTagInput,
    addTag,
    removeTag,
  };
}

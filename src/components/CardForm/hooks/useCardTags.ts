import { useMemo, useState, useEffect, useRef } from "react";
import { TextInput } from "react-native";
import type { VaultData } from "../../../types/vault";

export function useCardTags(initial?: string[], vault?: VaultData) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initial ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagInputVisible, setTagInputVisible] = useState(false);
  const tagInputRef = useRef<TextInput>(null);

  const allVaultTags = useMemo(() => {
    const set = new Set<string>();
    vault?.cards.forEach((c) =>
      c.tags?.forEach((t) => set.add(t.toLowerCase()))
    );
    return Array.from(set).sort();
  }, [vault]);

  const availableTags = useMemo(
    () => allVaultTags.filter((t) => !selectedTags.includes(t)),
    [allVaultTags, selectedTags]
  );

  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.trim().toLowerCase();
    return allVaultTags.filter(
      (t: string) => t.includes(input) && !selectedTags.includes(t)
    );
  }, [allVaultTags, tagInput, selectedTags]);

  useEffect(() => {
    if (tagInputVisible) {
      const timer = setTimeout(() => {
        tagInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tagInputVisible]);

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

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput("");
    setTagInputVisible(false);
  };

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
    availableTags,
    tagSuggestions,
    handleTagInput,
    addTag,
    removeTag,
  };
}

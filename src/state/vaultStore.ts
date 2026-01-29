import { create } from "zustand";

import type { Card, VaultData } from "../types/vault";
import { logger } from "../utils/logger";
import {
  VaultCorruptError,
  VaultMissingKeyError,
  deleteVaultBlob,
  deleteVaultKey,
  exportVaultBlob,
  getOrCreateVaultKey,
  importVaultBlob,
  readVaultData,
  vaultBlobExists,
  writeVaultData,
} from "../storage/vaultStorage";

type VaultError = "missing_key" | "corrupt" | "unknown";

type VaultState = {
  vault: VaultData | null;
  loading: boolean;
  error: VaultError | null;
  loadVault: () => Promise<void>;
  upsertCard: (card: Card) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  setTagColor: (tag: string, color?: string) => Promise<void>;
  renameTag: (from: string, to: string) => Promise<void>;
  deleteTag: (tag: string) => Promise<void>;
  resetVault: () => Promise<void>;
  exportVault: (passphrase: string) => Promise<string>;
  importVault: (sourceUri?: string, passphrase?: string) => Promise<void>;
  clearVaultData: () => void;
};

function nowIso() {
  return new Date().toISOString();
}

function emptyVault(): VaultData {
  return {
    version: 1,
    cards: [],
    updatedAt: nowIso(),
    tagColors: {},
  };
}

function compareCards(a: Card, b: Card) {
  const af = a.favorite ? 1 : 0;
  const bf = b.favorite ? 1 : 0;
  if (af !== bf) {
    // Favorites first
    return bf - af;
  }
  return a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase());
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vault: null,
  loading: false,
  error: null,
  loadVault: async () => {
    set({ loading: true, error: null });
    try {
      const exists = await vaultBlobExists();
      if (!exists) {
        logger.info("No vault blob found, creating new vault");
        await getOrCreateVaultKey();
        const vault = emptyVault();
        await writeVaultData(vault);
        set({ vault, loading: false, error: null });
        return;
      }
      const vault = await readVaultData();
      if (!vault) {
        logger.warn("Vault blob empty, recreating vault");
        const next = emptyVault();
        await writeVaultData(next);
        set({ vault: next, loading: false, error: null });
        return;
      }

      // Ensure tagColors map exists for legacy data
      if (!vault.tagColors) {
        vault.tagColors = {};
      }

      // Ensure cards are sorted alphabetically by nickname on load
      vault.cards.sort(compareCards);

      set({ vault, loading: false, error: null });
    } catch (error) {
      logger.error("Vault load failed", error);
      if (error instanceof VaultMissingKeyError) {
        logger.warn("Vault key missing, auto-resetting vault");
        await get().resetVault();
        return;
      }
      if (error instanceof VaultCorruptError) {
        set({ error: "corrupt", loading: false });
        return;
      }
      set({ error: "unknown", loading: false });
    }
  },
  upsertCard: async (card) => {
    const { vault } = get();
    if (!vault) {
      return;
    }
    const existingIndex = vault.cards.findIndex((item) => item.id === card.id);
    const updatedAt = nowIso();
    let cards: Card[];
    if (existingIndex >= 0) {
      const updated = { ...card, updatedAt };
      cards = vault.cards.map((item) => (item.id === card.id ? updated : item));
    } else {
      const created = { ...card, createdAt: updatedAt, updatedAt };
      cards = [...vault.cards, created];
    }

    // Sort favorites first, then alphabetically by nickname
    cards.sort(compareCards);

    const next: VaultData = { ...vault, cards, updatedAt };
    await writeVaultData(next);
    set({ vault: next });
  },
  deleteCard: async (cardId) => {
    const { vault } = get();
    if (!vault) {
      return;
    }
    const cards = vault.cards.filter((item) => item.id !== cardId);
    // Maintain internal sort: favorites first, then nickname
    cards.sort(compareCards);

    const next: VaultData = { ...vault, cards, updatedAt: nowIso() };
    await writeVaultData(next);
    set({ vault: next });
  },
  resetVault: async () => {
    set({ loading: true, error: null });
    try {
      logger.warn("Resetting vault");
      await deleteVaultBlob();
      await deleteVaultKey();
      await getOrCreateVaultKey();
      const fresh = emptyVault();
      await writeVaultData(fresh);
      set({ vault: fresh, error: null, loading: false });
    } catch (err) {
      logger.error("Reset vault failed", err);
      set({ vault: null, error: null, loading: false });
    }
  },
  exportVault: async (passphrase) => {
    const { vault } = get();
    if (vault) {
      await writeVaultData(vault);
    }
    return exportVaultBlob(passphrase);
  },
  importVault: async (sourceUri?: string, passphrase?: string) => {
    await importVaultBlob(sourceUri, passphrase);
    await get().loadVault();
  },
  clearVaultData: () => set({ vault: null }),
  setTagColor: async (tag, color) => {
    const { vault } = get();
    if (!vault) return;
    const tagKey = tag.trim().toLowerCase();
    if (!tagKey) return;
    const nextColors = { ...(vault.tagColors ?? {}) };
    if (!color) {
      delete nextColors[tagKey];
    } else {
      nextColors[tagKey] = color;
    }
    const next: VaultData = {
      ...vault,
      tagColors: nextColors,
      updatedAt: nowIso(),
    };
    await writeVaultData(next);
    set({ vault: next });
  },
  renameTag: async (from, to) => {
    const { vault } = get();
    if (!vault) return;
    const fromKey = from.trim().toLowerCase();
    const toKey = to.trim().toLowerCase();
    if (!fromKey || !toKey || fromKey === toKey) return;

    const updatedCards = vault.cards.map((card) => {
      const nextTags = Array.from(
        new Set(card.tags.map((t) => (t.toLowerCase() === fromKey ? toKey : t)))
      );
      return { ...card, tags: nextTags };
    });

    const nextColors = { ...(vault.tagColors ?? {}) };
    if (nextColors[fromKey] && !nextColors[toKey]) {
      nextColors[toKey] = nextColors[fromKey];
    }
    delete nextColors[fromKey];

    updatedCards.sort(compareCards);

    const next: VaultData = {
      ...vault,
      cards: updatedCards,
      tagColors: nextColors,
      updatedAt: nowIso(),
    };
    await writeVaultData(next);
    set({ vault: next });
  },
  deleteTag: async (tag) => {
    const { vault } = get();
    if (!vault) return;
    const tagKey = tag.trim().toLowerCase();
    if (!tagKey) return;

    const updatedCards = vault.cards.map((card) => {
      const nextTags = card.tags.filter((t) => t.toLowerCase() !== tagKey);
      return { ...card, tags: nextTags };
    });

    const nextColors = { ...(vault.tagColors ?? {}) };
    delete nextColors[tagKey];

    updatedCards.sort(compareCards);

    const next: VaultData = {
      ...vault,
      cards: updatedCards,
      tagColors: nextColors,
      updatedAt: nowIso(),
    };
    await writeVaultData(next);
    set({ vault: next });
  },
}));

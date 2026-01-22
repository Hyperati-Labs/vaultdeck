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
  };
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

      // Ensure cards are sorted alphabetically by nickname on load
      vault.cards.sort((a, b) =>
        a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())
      );

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

    // Sort alphabetically by nickname
    cards.sort((a, b) =>
      a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())
    );

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
    // Maintain internal sort just in case
    cards.sort((a, b) =>
      a.nickname.toLowerCase().localeCompare(b.nickname.toLowerCase())
    );

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
}));

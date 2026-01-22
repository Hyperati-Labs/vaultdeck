jest.mock("../src/storage/vaultStorage", () => {
  class VaultMissingKeyError extends Error {
    constructor() {
      super("missing");
      this.name = "VaultMissingKeyError";
    }
  }
  class VaultCorruptError extends Error {
    constructor() {
      super("corrupt");
      this.name = "VaultCorruptError";
    }
  }
  return {
    VaultMissingKeyError,
    VaultCorruptError,
    deleteVaultBlob: jest.fn(),
    deleteVaultKey: jest.fn(),
    exportVaultBlob: jest.fn(),
    getOrCreateVaultKey: jest.fn(),
    importVaultBlob: jest.fn(),
    readVaultData: jest.fn(),
    vaultBlobExists: jest.fn(),
    writeVaultData: jest.fn(),
  };
});

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
} from "../src/storage/vaultStorage";
import { useVaultStore } from "../src/state/vaultStore";

const baseCard = {
  id: "1",
  nickname: "Alpha",
  issuer: "Bank",
  cardholderName: "A",
  expiryMonth: "01",
  expiryYear: "30",
  tags: [],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

function resetVaultStore() {
  useVaultStore.setState({ vault: null, loading: false, error: null });
}

describe("vaultStore", () => {
  beforeEach(() => {
    resetVaultStore();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("creates a new vault when none exists", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(false);
    (getOrCreateVaultKey as jest.Mock).mockResolvedValue("key");

    await useVaultStore.getState().loadVault();

    const state = useVaultStore.getState();
    expect(state.vault?.cards).toEqual([]);
    expect(writeVaultData).toHaveBeenCalled();
  });

  it("recreates vault when blob is empty", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(true);
    (readVaultData as jest.Mock).mockResolvedValue(null);

    await useVaultStore.getState().loadVault();

    expect(useVaultStore.getState().vault?.cards).toEqual([]);
  });

  it("sorts cards by nickname on load", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(true);
    (readVaultData as jest.Mock).mockResolvedValue({
      version: 1,
      updatedAt: "2024-01-01",
      cards: [
        { ...baseCard, id: "2", nickname: "Zeta" },
        { ...baseCard, id: "1", nickname: "Alpha" },
      ],
    });

    await useVaultStore.getState().loadVault();

    const cards = useVaultStore.getState().vault?.cards ?? [];
    expect(cards.map((c) => c.nickname)).toEqual(["Alpha", "Zeta"]);
  });

  it("resets vault when key is missing", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(true);
    (readVaultData as jest.Mock).mockRejectedValue(new VaultMissingKeyError());

    await useVaultStore.getState().loadVault();

    expect(deleteVaultBlob).toHaveBeenCalled();
  });

  it("marks corrupt errors", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(true);
    (readVaultData as jest.Mock).mockRejectedValue(new VaultCorruptError());

    await useVaultStore.getState().loadVault();

    expect(useVaultStore.getState().error).toBe("corrupt");
  });

  it("marks unknown errors", async () => {
    (vaultBlobExists as jest.Mock).mockResolvedValue(true);
    (readVaultData as jest.Mock).mockRejectedValue(new Error("boom"));

    await useVaultStore.getState().loadVault();

    expect(useVaultStore.getState().error).toBe("unknown");
  });

  it("upserts and deletes cards", async () => {
    useVaultStore.setState({
      vault: { version: 1, updatedAt: "t", cards: [{ ...baseCard }] },
    });

    await useVaultStore.getState().upsertCard({
      ...baseCard,
      id: "2",
      nickname: "Beta",
    });

    let cards = useVaultStore.getState().vault?.cards ?? [];
    expect(cards.map((c) => c.nickname)).toEqual(["Alpha", "Beta"]);

    await useVaultStore.getState().deleteCard("1");
    cards = useVaultStore.getState().vault?.cards ?? [];
    expect(cards.map((c) => c.id)).toEqual(["2"]);
  });

  it("no-ops when vault is missing", async () => {
    useVaultStore.setState({ vault: null });

    await useVaultStore.getState().upsertCard({ ...baseCard });
    await useVaultStore.getState().deleteCard("1");

    expect(writeVaultData).not.toHaveBeenCalled();
  });

  it("updates existing cards", async () => {
    useVaultStore.setState({
      vault: { version: 1, updatedAt: "t", cards: [{ ...baseCard }] },
    });

    await useVaultStore.getState().upsertCard({
      ...baseCard,
      nickname: "Alpha",
      updatedAt: "old",
    });

    const card = useVaultStore.getState().vault?.cards[0];
    expect(card?.updatedAt).not.toBe("old");
  });

  it("updates one card while preserving others", async () => {
    useVaultStore.setState({
      vault: {
        version: 1,
        updatedAt: "t",
        cards: [
          { ...baseCard, id: "1", nickname: "Alpha" },
          { ...baseCard, id: "2", nickname: "Beta" },
        ],
      },
    });

    await useVaultStore.getState().upsertCard({
      ...baseCard,
      id: "1",
      nickname: "Alpha",
    });

    const cards = useVaultStore.getState().vault?.cards ?? [];
    expect(cards.length).toBe(2);
  });

  it("sorts after delete with multiple cards", async () => {
    useVaultStore.setState({
      vault: {
        version: 1,
        updatedAt: "t",
        cards: [
          { ...baseCard, id: "1", nickname: "Gamma" },
          { ...baseCard, id: "2", nickname: "Alpha" },
          { ...baseCard, id: "3", nickname: "Beta" },
        ],
      },
    });

    await useVaultStore.getState().deleteCard("1");

    const cards = useVaultStore.getState().vault?.cards ?? [];
    expect(cards.map((c) => c.nickname)).toEqual(["Alpha", "Beta"]);
  });

  it("resets vault data", async () => {
    (getOrCreateVaultKey as jest.Mock).mockResolvedValue("key");

    await useVaultStore.getState().resetVault();

    expect(deleteVaultBlob).toHaveBeenCalled();
    expect(deleteVaultKey).toHaveBeenCalled();
    expect(getOrCreateVaultKey).toHaveBeenCalled();
    expect(writeVaultData).toHaveBeenCalled();
    expect(useVaultStore.getState().vault).not.toBeNull();
  });

  it("handles reset errors", async () => {
    (deleteVaultBlob as jest.Mock).mockRejectedValue(new Error("fail"));

    await useVaultStore.getState().resetVault();

    expect(useVaultStore.getState().vault).toBeNull();
  });

  it("exports and imports vault", async () => {
    useVaultStore.setState({
      vault: { version: 1, updatedAt: "t", cards: [] },
    });
    (exportVaultBlob as jest.Mock).mockResolvedValue("path");

    const path = await useVaultStore.getState().exportVault("pass");

    expect(writeVaultData).toHaveBeenCalled();
    expect(path).toBe("path");

    const loadSpy = jest
      .spyOn(useVaultStore.getState(), "loadVault")
      .mockResolvedValue();
    await useVaultStore.getState().importVault("uri", "pass");

    expect(importVaultBlob).toHaveBeenCalledWith("uri", "pass");
    expect(loadSpy).toHaveBeenCalled();
  });

  it("exports without a cached vault", async () => {
    useVaultStore.setState({ vault: null });
    (exportVaultBlob as jest.Mock).mockResolvedValue("path");

    const path = await useVaultStore.getState().exportVault("pass");

    expect(path).toBe("path");
    expect(writeVaultData).not.toHaveBeenCalled();
  });

  it("clears vault data", () => {
    useVaultStore.setState({
      vault: { version: 1, updatedAt: "t", cards: [] },
    });

    useVaultStore.getState().clearVaultData();

    expect(useVaultStore.getState().vault).toBeNull();
  });
});

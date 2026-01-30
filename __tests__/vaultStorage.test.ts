function loadVaultStorage(options: {
  os: "web" | "ios" | "android";
  version?: number;
  fileExists?: boolean;
  fileContent?: string;
  secureItems?: Record<string, string | null>;
  fileInfoThrows?: boolean;
  decryptThrows?: boolean;
  readThrows?: boolean;
}) {
  jest.resetModules();
  const fileInfo = options.fileExists ?? true;
  const fileContent = options.fileContent ?? "";
  const secureItems = options.secureItems ?? {};

  jest.doMock("react-native", () => ({
    Platform: { OS: options.os, Version: options.version ?? 30 },
  }));

  const fileSystemMock = {
    documentDirectory: "file:///",
    getInfoAsync: options.fileInfoThrows
      ? jest.fn().mockRejectedValue(new Error("boom"))
      : jest.fn().mockResolvedValue({ exists: fileInfo }),
    deleteAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    readAsStringAsync: options.readThrows
      ? jest.fn().mockRejectedValue(new Error("read failed"))
      : jest.fn().mockResolvedValue(fileContent),
    EncodingType: { UTF8: "utf8" },
  };
  jest.doMock("expo-file-system/legacy", () => fileSystemMock);

  jest.doMock("expo-crypto", () => ({
    getRandomBytesAsync: async (length: number) =>
      new Uint8Array(Array.from({ length }, (_, i) => i % 255)),
  }));
  jest.doMock("@stablelib/pbkdf2", () => ({
    deriveKey: jest.fn(() => new Uint8Array(32)),
  }));
  jest.doMock("@stablelib/sha256", () => ({
    SHA256: {},
  }));

  const secureStoreMock = {
    getItem: jest.fn((key: string) =>
      Promise.resolve(secureItems[key] ?? null)
    ),
    setItem: jest.fn(),
    deleteItem: jest.fn(),
  };
  jest.doMock("../src/storage/secureStore", () => secureStoreMock);

  const decryptThrows = Boolean(options.decryptThrows);
  jest.doMock("../src/crypto/vaultCrypto", () => ({
    generateVaultKeyBytes: async () => new Uint8Array(32),
    encodeKeyBase64: () => "vault-key",
    decodeKeyBase64: () => new Uint8Array([1]),
    encryptPayload: async (plaintext: string) => ({
      version: 1 as const,
      nonce: "nonce",
      ciphertext: plaintext,
    }),
    decryptPayload: (payload: { ciphertext: string }) => {
      if (decryptThrows) {
        throw new Error("decrypt failed");
      }
      return payload.ciphertext;
    },
  }));

  let mod: typeof import("../src/storage/vaultStorage");
  jest.isolateModules(() => {
    mod = require("../src/storage/vaultStorage");
  });
  return { mod: mod!, fileSystemMock, secureStoreMock };
}

describe("vaultStorage helpers", () => {
  it("serializes and parses payloads", async () => {
    const { mod } = loadVaultStorage({ os: "ios" });
    const payload = { version: 1 as const, nonce: "n", ciphertext: "c" };
    const serialized = mod.serializeEncryptedPayload(payload);
    const parsed = mod.parseEncryptedPayload(serialized);

    expect(parsed).toEqual(payload);
  });

  it("rejects invalid payloads", async () => {
    const { mod } = loadVaultStorage({ os: "ios" });

    expect(() => mod.parseEncryptedPayload("{}")).toThrow(
      mod.VaultCorruptError
    );

    expect(() =>
      mod.parseEncryptedPayload(
        JSON.stringify({ version: 2, nonce: "n", ciphertext: "c" })
      )
    ).toThrow(mod.VaultCorruptError);
  });
});

describe("vaultStorage web flow", () => {
  it("handles key lifecycle and blob existence", async () => {
    const { mod, secureStoreMock } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "existing" },
    });

    expect(await mod.getVaultKey()).toBe("existing");
    expect(await mod.getOrCreateVaultKey()).toBe("existing");

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    expect(await mod.vaultBlobExists()).toBe(true);

    await mod.deleteVaultKey();
    expect(secureStoreMock.deleteItem).toHaveBeenCalledWith("vault_key_v1");

    await mod.deleteVaultBlob();
    expect(await mod.vaultBlobExists()).toBe(false);
  });

  it("creates a vault key when missing", async () => {
    const { mod, secureStoreMock } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: null },
    });

    const key = await mod.getOrCreateVaultKey();
    expect(key).toBe("vault-key");
    expect(secureStoreMock.setItem).toHaveBeenCalledWith(
      "vault_key_v1",
      "vault-key"
    );
  });

  it("exports and imports a web backup", async () => {
    const { mod, secureStoreMock } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    const uri = await mod.exportVaultBlob("passphrase");

    expect(uri).toBe("memory://vault-backup");

    await mod.importVaultBlob(undefined, "passphrase");
    expect(secureStoreMock.setItem).toHaveBeenCalledWith("vault_key_v1", "key");
  });

  it("handles web backup errors", async () => {
    const { mod } = loadVaultStorage({ os: "web" });

    await expect(mod.exportVaultBlob("")).rejects.toThrow(
      mod.VaultPassphraseRequiredError
    );
    await expect(mod.exportVaultBlob("pass")).rejects.toThrow(
      mod.VaultMissingKeyError
    );

    await expect(mod.importVaultBlob(undefined, "passphrase")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("rejects web export when blob missing but key present", async () => {
    const { mod } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });
    await expect(mod.exportVaultBlob("pass")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("rejects invalid web backup envelopes", async () => {
    const { mod } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    await mod.exportVaultBlob("passphrase");

    const originalParse = JSON.parse;
    const parseSpy = jest
      .spyOn(JSON, "parse")
      .mockImplementationOnce(() => ({
        magic: "BAD",
        version: 1,
      }))
      .mockImplementation((value: string) => originalParse(value));

    await expect(mod.importVaultBlob(undefined, "passphrase")).rejects.toThrow(
      mod.VaultCorruptError
    );

    parseSpy.mockRestore();
  });

  it("rejects missing fields in web backup envelopes", async () => {
    const { mod } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    await mod.exportVaultBlob("passphrase");

    const originalParse = JSON.parse;
    const parseSpy = jest
      .spyOn(JSON, "parse")
      .mockImplementationOnce(() => ({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
      }))
      .mockImplementation((value: string) => originalParse(value));

    await expect(mod.importVaultBlob(undefined, "passphrase")).rejects.toThrow(
      mod.VaultCorruptError
    );

    parseSpy.mockRestore();
  });

  it("rejects invalid iteration counts in web backups", async () => {
    const { mod } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    await mod.exportVaultBlob("passphrase");

    const originalParse = JSON.parse;
    const parseSpy = jest
      .spyOn(JSON, "parse")
      .mockImplementationOnce(() => ({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 1,
        payload: { version: 1, nonce: "n", ciphertext: "{}" },
      }))
      .mockImplementation((value: string) => originalParse(value));

    await expect(mod.importVaultBlob(undefined, "passphrase")).rejects.toThrow(
      mod.VaultCorruptError
    );

    parseSpy.mockRestore();
  });

  it("rejects missing passphrase on web import", async () => {
    const { mod } = loadVaultStorage({
      os: "web",
      secureItems: { vault_key_v1: "key" },
    });

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    await mod.exportVaultBlob("passphrase");

    await expect(mod.importVaultBlob()).rejects.toThrow(
      mod.VaultPassphraseRequiredError
    );
  });

  it("reads web vault data safely", async () => {
    const { mod } = loadVaultStorage({ os: "web" });

    expect(await mod.readVaultData()).toBeNull();

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] }, "key");
    await expect(mod.readVaultData()).rejects.toThrow(mod.VaultMissingKeyError);

    const data = await mod.readVaultData("key");
    expect(data?.cards).toEqual([]);

    const { mod: mod2 } = loadVaultStorage({ os: "web", decryptThrows: true });
    await mod2.writeVaultData({ version: 1, updatedAt: "t", cards: [] }, "key");
    await expect(mod2.readVaultData("key")).rejects.toThrow(
      mod2.VaultCorruptError
    );
  });

  it("rejects export when web key is missing", async () => {
    const { mod } = loadVaultStorage({ os: "web" });
    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] }, "key");
    await expect(mod.exportVaultBlob("passphrase")).rejects.toThrow(
      mod.VaultMissingKeyError
    );
  });
});

describe("vaultStorage native flow", () => {
  it("handles delete errors gracefully", async () => {
    const { mod } = loadVaultStorage({ os: "ios", fileInfoThrows: true });

    await mod.deleteVaultBlob();
  });

  it("deletes vault blob when present", async () => {
    const { mod, fileSystemMock } = loadVaultStorage({
      os: "ios",
      fileExists: true,
    });

    await mod.deleteVaultBlob();

    expect(fileSystemMock.deleteAsync).toHaveBeenCalled();
  });

  it("skips delete when blob missing", async () => {
    const { mod, fileSystemMock } = loadVaultStorage({
      os: "ios",
      fileExists: false,
    });

    await mod.deleteVaultBlob();

    expect(fileSystemMock.deleteAsync).not.toHaveBeenCalled();
  });

  it("reports blob existence", async () => {
    const { mod } = loadVaultStorage({ os: "ios", fileExists: true });
    expect(await mod.vaultBlobExists()).toBe(true);
  });

  it("reports missing blob existence", async () => {
    const { mod } = loadVaultStorage({ os: "ios", fileExists: false });
    expect(await mod.vaultBlobExists()).toBe(false);
  });

  it("exports when blob exists", async () => {
    const { mod, fileSystemMock } = loadVaultStorage({
      os: "android",
      version: 28,
      fileExists: true,
      fileContent: "blob",
      secureItems: { vault_key_v1: "key" },
    });

    const path = await mod.exportVaultBlob("passphrase");

    expect(path).toContain("vault-backup.blob");
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalled();
  });

  it("exports on newer android versions", async () => {
    const { mod } = loadVaultStorage({
      os: "android",
      version: 30,
      fileExists: true,
      fileContent: "blob",
      secureItems: { vault_key_v1: "key" },
    });

    await expect(mod.exportVaultBlob("passphrase")).resolves.toBeDefined();
  });

  it("exports when android api level is not numeric", async () => {
    const { mod } = loadVaultStorage({
      os: "android",
      version: "30" as unknown as number,
      fileExists: true,
      fileContent: "blob",
      secureItems: { vault_key_v1: "key" },
    });

    await expect(mod.exportVaultBlob("passphrase")).resolves.toBeDefined();
  });

  it("rejects export when data is missing", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: false,
      secureItems: { vault_key_v1: "key" },
    });

    await expect(mod.exportVaultBlob("passphrase")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("rejects export when key is missing", async () => {
    const { mod } = loadVaultStorage({ os: "ios", fileExists: true });

    await expect(mod.exportVaultBlob("passphrase")).rejects.toThrow(
      mod.VaultMissingKeyError
    );
  });

  it("imports when file exists", async () => {
    const { mod, fileSystemMock, secureStoreMock } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 120000,
        payload: {
          version: 1,
          nonce: "n",
          ciphertext: JSON.stringify({ key: "k", blob: "b" }),
        },
      }),
    });

    await mod.importVaultBlob(undefined, "passphrase");

    expect(secureStoreMock.setItem).toHaveBeenCalledWith("vault_key_v1", "k");
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalled();
  });

  it("rejects invalid imports", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: false,
    });

    await expect(mod.importVaultBlob()).rejects.toThrow(
      mod.VaultPassphraseRequiredError
    );

    await expect(mod.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod.VaultCorruptError
    );

    const { mod: mod2 } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: "not-json",
    });
    await expect(mod2.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod2.VaultCorruptError
    );

    const { mod: mod3 } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 10,
        payload: { version: 1, nonce: "n", ciphertext: "{}" },
      }),
    });
    await expect(mod3.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod3.VaultCorruptError
    );
  });

  it("rejects invalid format metadata", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "BAD",
        version: 4,
      }),
    });

    await expect(mod.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("rejects missing backup fields", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
      }),
    });

    await expect(mod.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("wraps unknown read errors", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      readThrows: true,
    });

    await expect(mod.importVaultBlob(undefined, "pass")).rejects.toThrow(Error);
  });

  it("rejects invalid decrypted backup payload json", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 120000,
        payload: { version: 1, nonce: "n", ciphertext: "not-json" },
      }),
    });

    await expect(mod.importVaultBlob(undefined, "pass")).rejects.toThrow(
      mod.VaultCorruptError
    );
  });

  it("skips import logging when __DEV__ is false", async () => {
    const originalDev = (global as { __DEV__?: boolean }).__DEV__;
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 120000,
        payload: {
          version: 1,
          nonce: "n",
          ciphertext: '{"key":"k","blob":"b"}',
        },
      }),
    });

    await mod.importVaultBlob(undefined, "pass");

    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("rejects missing passphrase on native import", async () => {
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        magic: "VAULTDECK_BACKUP",
        version: 4,
        kdf: "pbkdf2-sha256",
        salt: "salt",
        iterations: 120000,
        payload: { version: 1, nonce: "n", ciphertext: "{}" },
      }),
    });

    await expect(mod.importVaultBlob()).rejects.toThrow(
      mod.VaultPassphraseRequiredError
    );
  });

  it("reads and writes vault data", async () => {
    const { mod, fileSystemMock } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        version: 1,
        nonce: "n",
        ciphertext: JSON.stringify({ version: 1, updatedAt: "t", cards: [] }),
      }),
      secureItems: { vault_key_v1: "key" },
    });

    const data = await mod.readVaultData();
    expect(data?.cards).toEqual([]);

    await mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] });
    expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalled();
  });

  it("reads vault data without dev logging", async () => {
    const originalDev = (global as { __DEV__?: boolean }).__DEV__;
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: JSON.stringify({
        version: 1,
        nonce: "n",
        ciphertext: JSON.stringify({ version: 1, updatedAt: "t", cards: [] }),
      }),
      secureItems: { vault_key_v1: "key" },
    });

    const data = await mod.readVaultData();
    expect(data?.cards).toEqual([]);

    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("handles read errors without dev logging", async () => {
    const originalDev = (global as { __DEV__?: boolean }).__DEV__;
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const { mod } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: "bad",
      secureItems: { vault_key_v1: "key" },
    });

    await expect(mod.readVaultData()).rejects.toThrow(mod.VaultCorruptError);

    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("handles read errors", async () => {
    const { mod } = loadVaultStorage({ os: "ios", fileExists: false });
    expect(await mod.readVaultData()).toBeNull();

    const { mod: mod2 } = loadVaultStorage({ os: "ios", fileExists: true });
    await expect(mod2.readVaultData()).rejects.toThrow(
      mod2.VaultMissingKeyError
    );

    const { mod: mod3 } = loadVaultStorage({
      os: "ios",
      fileExists: true,
      fileContent: "bad",
      secureItems: { vault_key_v1: "key" },
    });
    await expect(mod3.readVaultData()).rejects.toThrow(mod3.VaultCorruptError);
  });

  it("rejects write when key is missing", async () => {
    const { mod } = loadVaultStorage({ os: "ios" });
    await expect(
      mod.writeVaultData({ version: 1, updatedAt: "t", cards: [] })
    ).rejects.toThrow(mod.VaultMissingKeyError);
  });
});

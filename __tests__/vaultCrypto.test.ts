jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: async (length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = i % 256;
    }
    return bytes;
  },
}));

import {
  decodeKeyBase64,
  decryptPayload,
  encodeKeyBase64,
  encryptPayload,
  generateVaultKeyBytes,
} from "../src/crypto/vaultCrypto";

describe("vaultCrypto", () => {
  it("round-trips encrypted payloads", async () => {
    const keyBytes = await generateVaultKeyBytes();
    const keyBase64 = encodeKeyBase64(keyBytes);
    const plaintext = JSON.stringify({ hello: "vault" });

    const payload = await encryptPayload(plaintext, decodeKeyBase64(keyBase64));
    const decrypted = decryptPayload(payload, decodeKeyBase64(keyBase64));

    expect(decrypted).toBe(plaintext);
  });

  it("rejects unsupported payload versions", async () => {
    const keyBytes = await generateVaultKeyBytes();
    const payload = await encryptPayload("{}", keyBytes);
    const badPayload = { ...payload, version: 2 } as unknown as typeof payload;
    expect(() => decryptPayload(badPayload, keyBytes)).toThrow(
      "Unsupported vault payload version"
    );
  });

  it("fails decryption with wrong key", async () => {
    const keyBytes = await generateVaultKeyBytes();
    const payload = await encryptPayload("{}", keyBytes);
    const wrongKey = new Uint8Array(keyBytes.length);
    expect(() => decryptPayload(payload, wrongKey)).toThrow(
      "Vault decryption failed"
    );
  });
});

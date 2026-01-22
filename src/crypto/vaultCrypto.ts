import nacl from "tweetnacl";
import * as Crypto from "expo-crypto";
import {
  decodeBase64,
  encodeBase64,
  decodeUTF8,
  encodeUTF8,
} from "tweetnacl-util";

export const VAULT_KEY_BYTES = 32;
export const VAULT_NONCE_BYTES = 24;

export type EncryptedPayload = {
  version: 1;
  nonce: string;
  ciphertext: string;
};

export async function generateVaultKeyBytes(): Promise<Uint8Array> {
  return Crypto.getRandomBytesAsync(VAULT_KEY_BYTES);
}

export function encodeKeyBase64(keyBytes: Uint8Array): string {
  return encodeBase64(keyBytes);
}

export function decodeKeyBase64(keyBase64: string): Uint8Array {
  return decodeBase64(keyBase64);
}

export async function encryptPayload(
  plaintextJson: string,
  keyBytes: Uint8Array
): Promise<EncryptedPayload> {
  const nonce = await Crypto.getRandomBytesAsync(VAULT_NONCE_BYTES);
  const plaintextBytes = decodeUTF8(plaintextJson);
  const ciphertext = nacl.secretbox(plaintextBytes, nonce, keyBytes);

  return {
    version: 1,
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(ciphertext),
  };
}

export function decryptPayload(
  payload: EncryptedPayload,
  keyBytes: Uint8Array
): string {
  if (payload.version !== 1) {
    throw new Error("Unsupported vault payload version");
  }
  const nonce = decodeBase64(payload.nonce);
  const ciphertext = decodeBase64(payload.ciphertext);
  const plaintextBytes = nacl.secretbox.open(ciphertext, nonce, keyBytes);
  if (!plaintextBytes) {
    throw new Error("Vault decryption failed");
  }
  return encodeUTF8(plaintextBytes);
}

import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { deriveKey } from "@stablelib/pbkdf2";
import { SHA256 } from "@stablelib/sha256";
import { decodeBase64, decodeUTF8, encodeBase64 } from "tweetnacl-util";
import { deleteItem, getItem, setItem } from "./secureStore";

import {
  decryptPayload,
  encodeKeyBase64,
  decodeKeyBase64,
  encryptPayload,
  generateVaultKeyBytes,
  type EncryptedPayload,
} from "../crypto/vaultCrypto";
import type { VaultData } from "../types/vault";
import { logger } from "../utils/logger";

const VAULT_KEY_ID = "vault_key_v1";
const VAULT_BLOB_PATH = `${FileSystem.documentDirectory}vault.blob`;
const VAULT_BACKUP_PATH = `${FileSystem.documentDirectory}vault-backup.blob`;
const VAULT_BACKUP_VERSION = 1;
const BACKUP_SALT_BYTES = 16;
const BACKUP_FORMAT_VERSION = 4;
const BACKUP_KDF_MIN_ITERATIONS = 60000;
const BACKUP_KDF_MAX_ITERATIONS = 180000;
const BACKUP_MAGIC = "VAULTDECK_BACKUP";
let webVaultBlob: string | null = null;
let webVaultBackup: string | null = null;

export class VaultMissingKeyError extends Error {
  constructor() {
    super("Vault key is missing");
    this.name = "VaultMissingKeyError";
  }
}

export class VaultCorruptError extends Error {
  constructor() {
    super("Vault data is corrupt or unreadable");
    this.name = "VaultCorruptError";
  }
}

export class VaultPassphraseRequiredError extends Error {
  constructor() {
    super("Backup passphrase required");
    this.name = "VaultPassphraseRequiredError";
  }
}

export async function getOrCreateVaultKey(): Promise<string> {
  const existing = await getItem(VAULT_KEY_ID);
  if (existing) {
    return existing;
  }
  const keyBytes = await generateVaultKeyBytes();
  const key = encodeKeyBase64(keyBytes);
  await setItem(VAULT_KEY_ID, key);
  return key;
}

export async function getVaultKey(): Promise<string | null> {
  return getItem(VAULT_KEY_ID);
}

export async function deleteVaultKey(): Promise<void> {
  await deleteItem(VAULT_KEY_ID);
}

export async function deleteVaultBlob(): Promise<void> {
  if (Platform.OS === "web") {
    webVaultBlob = null;
    return;
  }
  try {
    const info = await FileSystem.getInfoAsync(VAULT_BLOB_PATH);
    if (info.exists) {
      await FileSystem.deleteAsync(VAULT_BLOB_PATH, { idempotent: true });
    }
  } catch {
    // Ignore delete failures; reset flow will re-create data.
  }
}

export async function vaultBlobExists(): Promise<boolean> {
  if (Platform.OS === "web") {
    return Boolean(webVaultBlob);
  }
  const info = await FileSystem.getInfoAsync(VAULT_BLOB_PATH);
  return info.exists;
}

async function deriveBackupKey(
  passphrase: string,
  saltBase64: string,
  iterations: number
): Promise<Uint8Array> {
  const saltBytes = decodeBase64(saltBase64);
  const passBytes = decodeUTF8(passphrase);
  return deriveKey(SHA256, passBytes, saltBytes, iterations, 32);
}

function getBackupIterations(): number {
  if (Platform.OS === "android") {
    const apiLevel =
      typeof Platform.Version === "number" ? Platform.Version : 0;
    return apiLevel > 0 && apiLevel < 29 ? 60000 : 100000;
  }
  return 120000;
}

export async function exportVaultBlob(passphrase: string): Promise<string> {
  if (!passphrase) {
    throw new VaultPassphraseRequiredError();
  }
  if (Platform.OS === "web") {
    if (!webVaultBlob) {
      throw new VaultCorruptError();
    }
    const key = await getVaultKey();
    if (!key) {
      throw new VaultMissingKeyError();
    }
    const salt = encodeBase64(
      await Crypto.getRandomBytesAsync(BACKUP_SALT_BYTES)
    );
    const iterations = getBackupIterations();
    const derivedKey = await deriveBackupKey(passphrase, salt, iterations);
    const payload = await encryptPayload(
      JSON.stringify({
        version: VAULT_BACKUP_VERSION,
        key,
        blob: webVaultBlob,
      }),
      derivedKey
    );
    webVaultBackup = JSON.stringify({
      magic: BACKUP_MAGIC,
      version: BACKUP_FORMAT_VERSION,
      kdf: "pbkdf2-sha256",
      salt,
      iterations,
      payload,
    });
    return "memory://vault-backup";
  }
  const info = await FileSystem.getInfoAsync(VAULT_BLOB_PATH);
  if (!info.exists) {
    throw new VaultCorruptError();
  }
  const key = await getVaultKey();
  if (!key) {
    throw new VaultMissingKeyError();
  }
  const blob = await FileSystem.readAsStringAsync(VAULT_BLOB_PATH, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const salt = encodeBase64(
    await Crypto.getRandomBytesAsync(BACKUP_SALT_BYTES)
  );
  const iterations = getBackupIterations();
  const derivedKey = await deriveBackupKey(passphrase, salt, iterations);
  const payload = await encryptPayload(
    JSON.stringify({ version: VAULT_BACKUP_VERSION, key, blob }),
    derivedKey
  );
  const envelope = JSON.stringify({
    magic: BACKUP_MAGIC,
    version: BACKUP_FORMAT_VERSION,
    kdf: "pbkdf2-sha256",
    salt,
    iterations,
    payload,
  });
  await FileSystem.writeAsStringAsync(VAULT_BACKUP_PATH, envelope, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return VAULT_BACKUP_PATH;
}

export async function importVaultBlob(
  sourceUri?: string,
  passphrase?: string
): Promise<void> {
  if (Platform.OS === "web") {
    if (!webVaultBackup) {
      throw new VaultCorruptError();
    }
    const parsed = JSON.parse(webVaultBackup) as {
      magic?: string;
      version?: number;
      kdf?: string;
      salt?: string;
      iterations?: number;
      payload?: EncryptedPayload;
    };
    if (
      !parsed?.version ||
      parsed.version !== BACKUP_FORMAT_VERSION ||
      parsed.magic !== BACKUP_MAGIC
    ) {
      throw new VaultCorruptError();
    }
    if (!passphrase) {
      throw new VaultPassphraseRequiredError();
    }
    if (!parsed.salt || !parsed.payload || parsed.kdf !== "pbkdf2-sha256") {
      throw new VaultCorruptError();
    }
    if (
      !parsed.iterations ||
      parsed.iterations < BACKUP_KDF_MIN_ITERATIONS ||
      parsed.iterations > BACKUP_KDF_MAX_ITERATIONS
    ) {
      throw new VaultCorruptError();
    }
    const derivedKey = await deriveBackupKey(
      passphrase,
      parsed.salt,
      parsed.iterations
    );
    const plaintext = decryptPayload(parsed.payload, derivedKey);
    const backup = JSON.parse(plaintext) as { key: string; blob: string };
    await setItem(VAULT_KEY_ID, backup.key);
    webVaultBlob = backup.blob;
    return;
  }

  const fromUri = sourceUri ?? VAULT_BACKUP_PATH;
  const info = await FileSystem.getInfoAsync(fromUri);
  if (!info.exists) {
    throw new VaultCorruptError();
  }
  try {
    const content = await FileSystem.readAsStringAsync(fromUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (__DEV__) {
      logger.info("Import vault blob", {
        uri: fromUri,
        length: content.length,
      });
    }
    try {
      const parsed = JSON.parse(content) as {
        magic?: string;
        version?: number;
        kdf?: string;
        salt?: string;
        iterations?: number;
        payload?: EncryptedPayload;
      };
      if (
        !parsed?.version ||
        parsed.version !== BACKUP_FORMAT_VERSION ||
        parsed.magic !== BACKUP_MAGIC
      ) {
        throw new VaultCorruptError();
      }
      if (!passphrase) {
        throw new VaultPassphraseRequiredError();
      }
      if (!parsed.salt || !parsed.payload || parsed.kdf !== "pbkdf2-sha256") {
        throw new VaultCorruptError();
      }
      if (
        !parsed.iterations ||
        parsed.iterations < BACKUP_KDF_MIN_ITERATIONS ||
        parsed.iterations > BACKUP_KDF_MAX_ITERATIONS
      ) {
        throw new VaultCorruptError();
      }
      const derivedKey = await deriveBackupKey(
        passphrase,
        parsed.salt,
        parsed.iterations
      );
      const plaintext = decryptPayload(parsed.payload, derivedKey);
      const backup = JSON.parse(plaintext) as { key: string; blob: string };
      await setItem(VAULT_KEY_ID, backup.key);
      await FileSystem.writeAsStringAsync(VAULT_BLOB_PATH, backup.blob, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      return;
    } catch (error) {
      if (error instanceof VaultPassphraseRequiredError) {
        throw error;
      }
      if (error instanceof VaultCorruptError) {
        throw error;
      }
      throw new VaultCorruptError();
    }
  } catch (error) {
    if (error instanceof VaultPassphraseRequiredError) {
      throw error;
    }
    if (error instanceof VaultCorruptError) {
      throw error;
    }
    throw new VaultCorruptError();
  }
}

export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

export function parseEncryptedPayload(serialized: string): EncryptedPayload {
  const parsed = JSON.parse(serialized) as EncryptedPayload;
  if (!parsed || parsed.version !== 1 || !parsed.nonce || !parsed.ciphertext) {
    throw new VaultCorruptError();
  }
  return parsed;
}

export async function writeVaultData(
  vault: VaultData,
  keyBase64?: string
): Promise<void> {
  const key = keyBase64 ?? (await getVaultKey());
  if (!key) {
    throw new VaultMissingKeyError();
  }
  const payload = await encryptPayload(
    JSON.stringify(vault),
    decodeKeyBase64(key)
  );
  const serialized = serializeEncryptedPayload(payload);
  if (Platform.OS === "web") {
    webVaultBlob = serialized;
    return;
  }
  await FileSystem.writeAsStringAsync(VAULT_BLOB_PATH, serialized, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function readVaultData(
  keyBase64?: string
): Promise<VaultData | null> {
  if (Platform.OS === "web") {
    if (!webVaultBlob) {
      return null;
    }
    const key = keyBase64 ?? (await getVaultKey());
    if (!key) {
      throw new VaultMissingKeyError();
    }
    try {
      const payload = parseEncryptedPayload(webVaultBlob);
      const plaintext = decryptPayload(payload, decodeKeyBase64(key));
      return JSON.parse(plaintext) as VaultData;
    } catch {
      throw new VaultCorruptError();
    }
  }
  const info = await FileSystem.getInfoAsync(VAULT_BLOB_PATH);
  if (!info.exists) {
    return null;
  }
  const key = keyBase64 ?? (await getVaultKey());
  if (!key) {
    throw new VaultMissingKeyError();
  }
  try {
    const raw = await FileSystem.readAsStringAsync(VAULT_BLOB_PATH, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (__DEV__) {
      logger.info("Read vault blob", { length: raw.length });
    }
    const payload = parseEncryptedPayload(raw);
    const plaintext = decryptPayload(payload, decodeKeyBase64(key));
    return JSON.parse(plaintext) as VaultData;
  } catch (error) {
    if (__DEV__) {
      logger.error("Read vault blob failed", error);
    }
    throw new VaultCorruptError();
  }
}

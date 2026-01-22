import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const memoryStore = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  if (typeof SecureStore.getItemAsync !== "function") {
    return false;
  }
  if (typeof SecureStore.isAvailableAsync === "function") {
    try {
      return await SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }
  return true;
}

export async function getItem(key: string): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  return memoryStore.get(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return;
  }
  memoryStore.set(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  memoryStore.delete(key);
}

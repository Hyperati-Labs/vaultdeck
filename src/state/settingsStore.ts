import { create } from "zustand";

import { getItem, setItem } from "../storage/secureStore";

const HAPTICS_KEY = "vault_haptics_enabled_v1";
const CLIPBOARD_TIMEOUT_KEY = "vault_clipboard_timeout_v1";
const DEFAULT_CLIPBOARD_TIMEOUT = 10;

type SettingsState = {
  hapticsEnabled: boolean;
  clipboardTimeoutSeconds: number;
  initialized: boolean;
  loadSettings: () => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setClipboardTimeoutSeconds: (seconds: number) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  hapticsEnabled: true,
  clipboardTimeoutSeconds: DEFAULT_CLIPBOARD_TIMEOUT,
  initialized: false,
  loadSettings: async () => {
    const [storedHaptics, storedClipboard] = await Promise.all([
      getItem(HAPTICS_KEY),
      getItem(CLIPBOARD_TIMEOUT_KEY),
    ]);
    const hapticsEnabled =
      storedHaptics === null ? true : storedHaptics === "1";
    const parsedClipboard = storedClipboard
      ? Number(storedClipboard)
      : DEFAULT_CLIPBOARD_TIMEOUT;
    const clipboardTimeoutSeconds =
      Number.isFinite(parsedClipboard) && parsedClipboard >= 0
        ? parsedClipboard
        : DEFAULT_CLIPBOARD_TIMEOUT;
    set({ hapticsEnabled, clipboardTimeoutSeconds, initialized: true });
  },
  setHapticsEnabled: async (enabled) => {
    await setItem(HAPTICS_KEY, enabled ? "1" : "0");
    set({ hapticsEnabled: enabled });
  },
  setClipboardTimeoutSeconds: async (seconds) => {
    await setItem(CLIPBOARD_TIMEOUT_KEY, String(seconds));
    set({ clipboardTimeoutSeconds: seconds });
  },
}));

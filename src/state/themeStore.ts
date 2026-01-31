import { create } from "zustand";

import { getItem, setItem } from "../storage/secureStore";
import {
  type AccentKey,
  DEFAULT_ACCENT_KEY,
  ACCENT_PALETTES,
} from "../utils/theme";

export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "vault_theme_pref_v1";
const ACCENT_KEY = "vault_accent_pref_v1";

const isValidAccentKey = (v: string): v is AccentKey => v in ACCENT_PALETTES;

type ThemeState = {
  preference: ThemePreference;
  accentKey: AccentKey;
  initialized: boolean;
  loadPreference: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
  setAccentKey: (accentKey: AccentKey) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  accentKey: DEFAULT_ACCENT_KEY,
  initialized: false,
  loadPreference: async () => {
    const [storedTheme, storedAccent] = await Promise.all([
      getItem(THEME_KEY),
      getItem(ACCENT_KEY),
    ]);
    const preference =
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
        ? storedTheme
        : "system";
    const accentKey =
      storedAccent !== null && isValidAccentKey(storedAccent)
        ? storedAccent
        : DEFAULT_ACCENT_KEY;
    set({ preference, accentKey, initialized: true });
  },
  setPreference: async (preference) => {
    await setItem(THEME_KEY, preference);
    set({ preference });
  },
  setAccentKey: async (accentKey) => {
    await setItem(ACCENT_KEY, accentKey);
    set({ accentKey });
  },
}));

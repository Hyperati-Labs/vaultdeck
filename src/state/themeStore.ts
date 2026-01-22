import { create } from "zustand";

import { getItem, setItem } from "../storage/secureStore";

export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "vault_theme_pref_v1";

type ThemeState = {
  preference: ThemePreference;
  initialized: boolean;
  loadPreference: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  initialized: false,
  loadPreference: async () => {
    const stored = await getItem(THEME_KEY);
    const preference =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    set({ preference, initialized: true });
  },
  setPreference: async (preference) => {
    await setItem(THEME_KEY, preference);
    set({ preference });
  },
}));

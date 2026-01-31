import { useColorScheme } from "react-native";

import { useThemeStore } from "../state/themeStore";
import { themes, ACCENT_PALETTES } from "./theme";

export function useTheme() {
  const scheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);
  const accentKey = useThemeStore((state) => state.accentKey);

  const base =
    preference === "light"
      ? themes.light
      : preference === "dark"
        ? themes.dark
        : scheme === "dark"
          ? themes.dark
          : themes.light;

  const palette = ACCENT_PALETTES[accentKey];
  const mode = base.isDark ? "dark" : "light";
  const accentColors = palette[mode];

  return {
    ...base,
    colors: {
      ...base.colors,
      accent: accentColors.accent,
      accentSoft: accentColors.accentSoft,
    },
  };
}

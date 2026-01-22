import { useColorScheme } from "react-native";

import { useThemeStore } from "../state/themeStore";
import { themes } from "./theme";

export function useTheme() {
  const scheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);

  if (preference === "light") {
    return themes.light;
  }
  if (preference === "dark") {
    return themes.dark;
  }
  return scheme === "dark" ? themes.dark : themes.light;
}

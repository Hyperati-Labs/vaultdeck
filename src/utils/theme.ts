export type Theme = {
  isDark: boolean;
  colors: {
    ink: string;
    muted: string;
    accent: string;
    accentSoft: string;
    surface: string;
    surfaceTint: string;
    outline: string;
    danger: string;
    gradientTop: string;
    gradientMid: string;
    gradientBottom: string;
    glass: string;
    glassBorder: string;
    inputBg: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  font: {
    regular: string;
    bold: string;
  };
};

/** Accent palette: accent + accentSoft for light and dark mode */
export type AccentPalette = {
  light: { accent: string; accentSoft: string };
  dark: { accent: string; accentSoft: string };
};

export type AccentKey = "amber" | "blue" | "green" | "violet" | "rose" | "teal";

export const ACCENT_PALETTES: Record<AccentKey, AccentPalette> = {
  amber: {
    light: { accent: "#d07b2f", accentSoft: "#f6e2cf" },
    dark: { accent: "#ff9f43", accentSoft: "#2b2117" },
  },
  blue: {
    light: { accent: "#1a6bb3", accentSoft: "#e3f2fd" },
    dark: { accent: "#4da6ff", accentSoft: "#1a2744" },
  },
  green: {
    light: { accent: "#2e7d32", accentSoft: "#e8f5e9" },
    dark: { accent: "#66bb6a", accentSoft: "#1b2e1b" },
  },
  violet: {
    light: { accent: "#6a1b9a", accentSoft: "#f3e5f5" },
    dark: { accent: "#ab47bc", accentSoft: "#2d1b33" },
  },
  rose: {
    light: { accent: "#c2185b", accentSoft: "#fce4ec" },
    dark: { accent: "#f06292", accentSoft: "#2d1b24" },
  },
  teal: {
    light: { accent: "#00796b", accentSoft: "#e0f2f1" },
    dark: { accent: "#26a69a", accentSoft: "#1b2e2c" },
  },
};

export const ACCENT_LABELS: Record<AccentKey, string> = {
  amber: "Amber",
  blue: "Blue",
  green: "Green",
  violet: "Violet",
  rose: "Rose",
  teal: "Teal",
};

export const DEFAULT_ACCENT_KEY: AccentKey = "amber";

export const themes: { light: Theme; dark: Theme } = {
  light: {
    isDark: false,
    colors: {
      ink: "#0b0f1a",
      muted: "#5b6472",
      accent: "#d07b2f",
      accentSoft: "#f6e2cf",
      surface: "#ffffff",
      surfaceTint: "#f6f2ee",
      outline: "#e5ddd5",
      danger: "#b00020",
      gradientTop: "#f8f4ef",
      gradientMid: "#f4f7f9",
      gradientBottom: "#eef1f7",
      glass: "rgba(255, 255, 255, 0.72)",
      glassBorder: "rgba(255, 255, 255, 0.5)",
      inputBg: "rgba(255, 255, 255, 0.9)",
    },
    radius: {
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
    },
    font: {
      regular: "SpaceGrotesk_500Medium",
      bold: "SpaceGrotesk_700Bold",
    },
  },
  dark: {
    isDark: true,
    colors: {
      ink: "#f4f6fb",
      muted: "#a2a9b8",
      accent: "#ff9f43",
      accentSoft: "#2b2117",
      surface: "#0f141b",
      surfaceTint: "#131a24",
      outline: "#273142",
      danger: "#ff6b6b",
      gradientTop: "#0c1016",
      gradientMid: "#121823",
      gradientBottom: "#0a0f15",
      glass: "rgba(18, 24, 35, 0.7)",
      glassBorder: "rgba(255, 255, 255, 0.08)",
      inputBg: "rgba(18, 24, 35, 0.85)",
    },
    radius: {
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 24,
      xl: 32,
    },
    font: {
      regular: "SpaceGrotesk_500Medium",
      bold: "SpaceGrotesk_700Bold",
    },
  },
};

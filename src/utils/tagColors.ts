import { Theme } from "./theme";

export type TagColor = {
  bg: string;
  border: string;
  text: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
};

export const TAG_COLOR_PRESETS: string[] = [
  "#d6336c",
  "#364fc7",
  "#2b8a3e",
  "#f08c00",
  "#ae3ec9",
  "#0ca678",
  "#e03131",
  "#1c7ed6",
  "#f76707",
  "#495057",
  "#12b886",
  "#ffa94d",
];

const lightPalette: TagColor[] = [
  {
    bg: "#fce4ec",
    border: "#f8bbd0",
    text: "#ad1457",
    activeBg: "#f8bbd0",
    activeBorder: "#ad1457",
    activeText: "#8c0f46",
  },
  {
    bg: "#e3f2fd",
    border: "#bbdefb",
    text: "#1565c0",
    activeBg: "#bbdefb",
    activeBorder: "#1565c0",
    activeText: "#0f4b8f",
  },
  {
    bg: "#e8f5e9",
    border: "#c8e6c9",
    text: "#2e7d32",
    activeBg: "#c8e6c9",
    activeBorder: "#2e7d32",
    activeText: "#225f25",
  },
  {
    bg: "#fff3e0",
    border: "#ffe0b2",
    text: "#e65100",
    activeBg: "#ffe0b2",
    activeBorder: "#e65100",
    activeText: "#b53f00",
  },
  {
    bg: "#f3e5f5",
    border: "#e1bee7",
    text: "#6a1b9a",
    activeBg: "#e1bee7",
    activeBorder: "#6a1b9a",
    activeText: "#53147a",
  },
  {
    bg: "#e0f7fa",
    border: "#b2ebf2",
    text: "#006064",
    activeBg: "#b2ebf2",
    activeBorder: "#006064",
    activeText: "#00474a",
  },
  {
    bg: "#fff8e1",
    border: "#ffecb3",
    text: "#b28704",
    activeBg: "#ffecb3",
    activeBorder: "#b28704",
    activeText: "#8b6a03",
  },
  {
    bg: "#eceff1",
    border: "#cfd8dc",
    text: "#455a64",
    activeBg: "#cfd8dc",
    activeBorder: "#455a64",
    activeText: "#2f3f46",
  },
];

const darkPalette: TagColor[] = [
  {
    bg: "#4a1f2f",
    border: "#7a2f4c",
    text: "#f8c1d8",
    activeBg: "#7a2f4c",
    activeBorder: "#f8c1d8",
    activeText: "#ffe3f1",
  },
  {
    bg: "#1c2b3a",
    border: "#27435c",
    text: "#9cc3ff",
    activeBg: "#27435c",
    activeBorder: "#9cc3ff",
    activeText: "#cfe2ff",
  },
  {
    bg: "#1d3524",
    border: "#2f5a3b",
    text: "#b7f0c2",
    activeBg: "#2f5a3b",
    activeBorder: "#b7f0c2",
    activeText: "#dbffdf",
  },
  {
    bg: "#3a2a14",
    border: "#5a3f1d",
    text: "#ffd9a0",
    activeBg: "#5a3f1d",
    activeBorder: "#ffd9a0",
    activeText: "#ffe8c3",
  },
  {
    bg: "#2d1f3b",
    border: "#4b3362",
    text: "#d6c1ff",
    activeBg: "#4b3362",
    activeBorder: "#d6c1ff",
    activeText: "#eee4ff",
  },
  {
    bg: "#15363c",
    border: "#1f5661",
    text: "#b7ecf2",
    activeBg: "#1f5661",
    activeBorder: "#b7ecf2",
    activeText: "#ddf8fb",
  },
  {
    bg: "#3a2f1a",
    border: "#5b4624",
    text: "#ffe7a3",
    activeBg: "#5b4624",
    activeBorder: "#ffe7a3",
    activeText: "#fff2c9",
  },
  {
    bg: "#2a3137",
    border: "#3d4a55",
    text: "#d6e3ed",
    activeBg: "#3d4a55",
    activeBorder: "#d6e3ed",
    activeText: "#edf4f8",
  },
];

function hashTag(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const num = parseInt(
    normalized.length === 3 ? normalized.replace(/./g, "$&$&") : normalized,
    16
  );
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbaString(
  { r, g, b }: { r: number; g: number; b: number },
  alpha: number
) {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildColorSet(baseHex: string, theme: Theme): TagColor {
  const rgb = hexToRgb(baseHex);
  const bgAlpha = theme.isDark ? 0.18 : 0.16;
  const borderAlpha = theme.isDark ? 0.5 : 0.45;
  const activeBgAlpha = theme.isDark ? 0.26 : 0.24;
  const activeBorderAlpha = theme.isDark ? 0.7 : 0.65;
  return {
    bg: rgbaString(rgb, bgAlpha),
    border: rgbaString(rgb, borderAlpha),
    text: baseHex,
    activeBg: rgbaString(rgb, activeBgAlpha),
    activeBorder: rgbaString(rgb, activeBorderAlpha),
    activeText: baseHex,
  };
}

export function getTagColor(
  tag: string,
  theme: Theme,
  userColor?: string
): TagColor {
  const palette = theme.isDark ? darkPalette : lightPalette;
  const key = tag.trim().toLowerCase();
  if (!key) {
    return {
      bg: theme.colors.surfaceTint,
      border: theme.colors.outline,
      text: theme.colors.ink,
      activeBg: theme.colors.surfaceTint,
      activeBorder: theme.colors.outline,
      activeText: theme.colors.ink,
    };
  }

  if (userColor) {
    return buildColorSet(userColor, theme);
  }

  const index = hashTag(key) % palette.length;
  return palette[index];
}

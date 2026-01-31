import {
  themes,
  ACCENT_PALETTES,
  ACCENT_LABELS,
  DEFAULT_ACCENT_KEY,
  type AccentKey,
} from "../src/utils/theme";

describe("theme", () => {
  it("exposes light/dark theme tokens", () => {
    expect(themes.light.isDark).toBe(false);
    expect(themes.dark.isDark).toBe(true);
    expect(themes.light.colors.ink).toBeDefined();
    expect(themes.dark.colors.ink).toBeDefined();
  });

  it("exposes accent palettes for all accent keys", () => {
    const keys = Object.keys(ACCENT_PALETTES) as AccentKey[];
    expect(keys).toContain(DEFAULT_ACCENT_KEY);
    keys.forEach((key) => {
      const palette = ACCENT_PALETTES[key];
      expect(palette.light.accent).toBeDefined();
      expect(palette.light.accentSoft).toBeDefined();
      expect(palette.dark.accent).toBeDefined();
      expect(palette.dark.accentSoft).toBeDefined();
      expect(ACCENT_LABELS[key]).toBeDefined();
    });
  });
});

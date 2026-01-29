import { getTagColor, TAG_COLOR_PRESETS } from "../src/utils/tagColors";
import { themes } from "../src/utils/theme";

describe("tagColors", () => {
  const light = themes.light;
  const dark = themes.dark;

  it("uses theme defaults when tag is empty", () => {
    const color = getTagColor("", light);
    expect(color.bg).toBe(light.colors.surfaceTint);
    expect(color.border).toBe(light.colors.outline);
    expect(color.text).toBe(light.colors.ink);
    expect(color.activeBg).toBe(light.colors.surfaceTint);
    expect(color.activeBorder).toBe(light.colors.outline);
    expect(color.activeText).toBe(light.colors.ink);
  });

  it("honors a user-specified color", () => {
    const base = "#ff0000";
    const color = getTagColor("custom", light, base);
    expect(color.text).toBe(base);
    expect(color.activeText).toBe(base);
    expect(color.bg.startsWith("rgba(")).toBe(true);
    expect(color.activeBg.startsWith("rgba(")).toBe(true);
    expect(color.border.startsWith("rgba(")).toBe(true);
  });

  it("supports short-hex user colors and dark-theme alpha tuning", () => {
    const color = getTagColor("shorthex", dark, "#abc");
    expect(color.text).toBe("#abc");
    expect(color.bg).toBe("rgba(170, 187, 204, 0.18)");
    expect(color.border).toBe("rgba(170, 187, 204, 0.5)");
    expect(color.activeBg).toBe("rgba(170, 187, 204, 0.26)");
    expect(color.activeBorder).toBe("rgba(170, 187, 204, 0.7)");
  });

  it("is deterministic for the same tag within a theme", () => {
    const a1 = getTagColor("alpha", light);
    const a2 = getTagColor("alpha", light);
    expect(a1).toEqual(a2);
  });

  it("uses different palette variants between light and dark themes", () => {
    const lightColor = getTagColor("palette-test", light);
    const darkColor = getTagColor("palette-test", dark);
    expect(lightColor).not.toEqual(darkColor);
  });

  it("exposes preset swatches", () => {
    expect(Array.isArray(TAG_COLOR_PRESETS)).toBe(true);
    expect(TAG_COLOR_PRESETS.length).toBeGreaterThan(6);
    TAG_COLOR_PRESETS.forEach((hex) => {
      expect(hex).toMatch(/^#/);
    });
  });
});

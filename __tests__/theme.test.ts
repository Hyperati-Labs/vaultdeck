import { themes } from "../src/utils/theme";

describe("theme", () => {
  it("exposes light/dark theme tokens", () => {
    expect(themes.light.isDark).toBe(false);
    expect(themes.dark.isDark).toBe(true);
    expect(themes.light.colors.ink).toBeDefined();
    expect(themes.dark.colors.ink).toBeDefined();
  });
});

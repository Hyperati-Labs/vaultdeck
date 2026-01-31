jest.mock("../src/storage/secureStore", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { getItem, setItem } from "../src/storage/secureStore";
import { useThemeStore } from "../src/state/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({
      preference: "system",
      accentKey: "amber",
      initialized: false,
    });
    jest.clearAllMocks();
  });

  it("loads preference with fallback", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("invalid")
      .mockResolvedValueOnce(null);

    await useThemeStore.getState().loadPreference();

    const state = useThemeStore.getState();
    expect(state.preference).toBe("system");
    expect(state.accentKey).toBe("amber");
    expect(state.initialized).toBe(true);
  });

  it("loads stored preference", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("dark")
      .mockResolvedValueOnce(null);

    await useThemeStore.getState().loadPreference();

    expect(useThemeStore.getState().preference).toBe("dark");
  });

  it("loads stored accent key", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("system")
      .mockResolvedValueOnce("blue");

    await useThemeStore.getState().loadPreference();

    expect(useThemeStore.getState().accentKey).toBe("blue");
  });

  it("falls back to default accent when stored value is invalid", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("light")
      .mockResolvedValueOnce("invalid_accent");

    await useThemeStore.getState().loadPreference();

    expect(useThemeStore.getState().accentKey).toBe("amber");
  });

  it("updates preference", async () => {
    await useThemeStore.getState().setPreference("light");

    expect(useThemeStore.getState().preference).toBe("light");
    expect(setItem).toHaveBeenCalledWith("vault_theme_pref_v1", "light");
  });

  it("updates accent key", async () => {
    await useThemeStore.getState().setAccentKey("violet");

    expect(useThemeStore.getState().accentKey).toBe("violet");
    expect(setItem).toHaveBeenCalledWith("vault_accent_pref_v1", "violet");
  });
});

jest.mock("../src/storage/secureStore", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { getItem, setItem } from "../src/storage/secureStore";
import { useThemeStore } from "../src/state/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ preference: "system", initialized: false });
    jest.clearAllMocks();
  });

  it("loads preference with fallback", async () => {
    (getItem as jest.Mock).mockResolvedValueOnce("invalid");

    await useThemeStore.getState().loadPreference();

    const state = useThemeStore.getState();
    expect(state.preference).toBe("system");
    expect(state.initialized).toBe(true);
  });

  it("loads stored preference", async () => {
    (getItem as jest.Mock).mockResolvedValueOnce("dark");

    await useThemeStore.getState().loadPreference();

    expect(useThemeStore.getState().preference).toBe("dark");
  });

  it("updates preference", async () => {
    await useThemeStore.getState().setPreference("light");

    expect(useThemeStore.getState().preference).toBe("light");
    expect(setItem).toHaveBeenCalledWith("vault_theme_pref_v1", "light");
  });
});

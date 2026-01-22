jest.mock("../src/storage/secureStore", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { getItem, setItem } from "../src/storage/secureStore";
import { useSettingsStore } from "../src/state/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      hapticsEnabled: true,
      clipboardTimeoutSeconds: 10,
      initialized: false,
    });
    jest.clearAllMocks();
  });

  it("loads settings with defaults", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.hapticsEnabled).toBe(true);
    expect(state.clipboardTimeoutSeconds).toBe(10);
    expect(state.initialized).toBe(true);
  });

  it("loads settings with stored values", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("0")
      .mockResolvedValueOnce("30");

    await useSettingsStore.getState().loadSettings();

    const state = useSettingsStore.getState();
    expect(state.hapticsEnabled).toBe(false);
    expect(state.clipboardTimeoutSeconds).toBe(30);
  });

  it("falls back when clipboard timeout is invalid", async () => {
    (getItem as jest.Mock)
      .mockResolvedValueOnce("1")
      .mockResolvedValueOnce("-1");

    await useSettingsStore.getState().loadSettings();

    expect(useSettingsStore.getState().clipboardTimeoutSeconds).toBe(10);
  });

  it("updates settings", async () => {
    await useSettingsStore.getState().setHapticsEnabled(false);
    await useSettingsStore.getState().setClipboardTimeoutSeconds(60);

    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);
    expect(useSettingsStore.getState().clipboardTimeoutSeconds).toBe(60);
    expect(setItem).toHaveBeenCalled();
  });

  it("enables haptics", async () => {
    await useSettingsStore.getState().setHapticsEnabled(true);

    expect(useSettingsStore.getState().hapticsEnabled).toBe(true);
    expect(setItem).toHaveBeenCalledWith("vault_haptics_enabled_v1", "1");
  });
});

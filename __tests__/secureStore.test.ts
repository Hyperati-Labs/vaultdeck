function loadSecureStore(options: {
  os: string;
  hasGetItem?: boolean;
  hasIsAvailable?: boolean;
  isAvailable?: boolean;
  isAvailableThrows?: boolean;
}) {
  jest.resetModules();
  jest.doMock("react-native", () => ({
    Platform: { OS: options.os },
  }));
  const secureStoreMock: Record<string, unknown> = {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  };
  if (options.hasGetItem !== false) {
    secureStoreMock.getItemAsync = jest.fn();
    secureStoreMock.setItemAsync = jest.fn();
    secureStoreMock.deleteItemAsync = jest.fn();
  }
  if (options.hasIsAvailable) {
    secureStoreMock.isAvailableAsync = options.isAvailableThrows
      ? jest.fn().mockRejectedValue(new Error("boom"))
      : jest.fn().mockResolvedValue(Boolean(options.isAvailable));
  }
  jest.doMock("expo-secure-store", () => secureStoreMock);

  let mod: typeof import("../src/storage/secureStore");
  let secureStore: typeof import("expo-secure-store");
  jest.isolateModules(() => {
    mod = require("../src/storage/secureStore");
    secureStore = require("expo-secure-store");
  });
  return { mod: mod!, secureStore: secureStore! };
}

describe("secureStore", () => {
  it("uses memory store on web", async () => {
    const { mod } = loadSecureStore({ os: "web" });

    expect(await mod.getItem("k")).toBeNull();
    await mod.setItem("k", "v");
    expect(await mod.getItem("k")).toBe("v");
    await mod.deleteItem("k");
    expect(await mod.getItem("k")).toBeNull();
  });

  it("uses memory store when secure store missing", async () => {
    const { mod } = loadSecureStore({ os: "ios", hasGetItem: false });

    await mod.setItem("k", "v");
    expect(await mod.getItem("k")).toBe("v");
  });

  it("uses memory store when availability check fails", async () => {
    const { mod } = loadSecureStore({
      os: "ios",
      hasIsAvailable: true,
      isAvailableThrows: true,
    });

    await mod.setItem("k", "v");
    expect(await mod.getItem("k")).toBe("v");
  });

  it("uses secure store when available", async () => {
    const { mod, secureStore } = loadSecureStore({
      os: "ios",
      hasIsAvailable: true,
      isAvailable: true,
    });
    (secureStore.getItemAsync as jest.Mock).mockResolvedValue("stored");

    expect(await mod.getItem("k")).toBe("stored");
    await mod.setItem("k", "v");
    await mod.deleteItem("k");

    expect(secureStore.setItemAsync).toHaveBeenCalled();
    expect(secureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("uses secure store when availability check is missing", async () => {
    const { mod, secureStore } = loadSecureStore({
      os: "ios",
      hasIsAvailable: false,
    });
    (secureStore.getItemAsync as jest.Mock).mockResolvedValue("stored");

    expect(await mod.getItem("k")).toBe("stored");
  });
});

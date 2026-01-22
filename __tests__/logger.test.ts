import { logger } from "../src/utils/logger";

describe("logger", () => {
  const originalDev = (global as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    (global as { __DEV__?: boolean }).__DEV__ = originalDev;
  });

  it("logs when __DEV__ is true", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const info = jest
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    logger.info("hello");

    expect(info).toHaveBeenCalledWith("[VaultDeck] hello");
  });

  it("skips logs when __DEV__ is false", () => {
    (global as { __DEV__?: boolean }).__DEV__ = false;
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    logger.warn("nope", { ok: true });

    expect(warn).not.toHaveBeenCalled();
  });

  it("logs metadata when provided", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const error = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logger.error("boom", { code: "X" });

    expect(error).toHaveBeenCalledWith("[VaultDeck] boom", { code: "X" });
  });

  it("logs debug messages", () => {
    (global as { __DEV__?: boolean }).__DEV__ = true;
    const debug = jest
      .spyOn(console, "debug")
      .mockImplementation(() => undefined);

    logger.debug("trace");

    expect(debug).toHaveBeenCalledWith("[VaultDeck] trace");
  });
});

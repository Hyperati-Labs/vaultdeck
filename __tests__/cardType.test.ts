import { detectCardType } from "../src/utils/cardType";

describe("cardType", () => {
  it("detects Visa", () => {
    expect(detectCardType("4111 1111 1111 1111")).toBe("visa");
  });

  it("detects Mastercard (51-55 and 2221-2720)", () => {
    expect(detectCardType("5555 5555 5555 4444")).toBe("mastercard");
    expect(detectCardType("2221 0000 0000 0000")).toBe("mastercard");
  });

  it("detects Amex", () => {
    expect(detectCardType("3714 496353 98431")).toBe("amex");
  });

  it("detects Discover", () => {
    expect(detectCardType("6011 0000 0000 0004")).toBe("discover");
    expect(detectCardType("6511 0000 0000 0004")).toBe("discover");
    expect(detectCardType("6450 0000 0000 0000")).toBe("discover");
  });

  it("falls back to unknown", () => {
    expect(detectCardType("")).toBe("unknown");
    expect(detectCardType("0000 0000 0000 0000")).toBe("unknown");
  });
});

import { secureCompare } from "../src/utils/secureCompare";

describe("secureCompare", () => {
  it("returns true for equal strings", () => {
    expect(secureCompare("abc123", "abc123")).toBe(true);
  });

  it("returns false for different strings of equal length", () => {
    expect(secureCompare("abc123", "abc124")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(secureCompare("short", "longer")).toBe(false);
  });
});

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: async () => new Uint8Array([1, 2, 3, 4]),
}));

jest.mock("tweetnacl-util", () => ({
  encodeBase64: () => "ab+/=",
}));

import { generateId } from "../src/utils/id";

describe("id", () => {
  it("generates a sanitized base64 id", async () => {
    const id = await generateId();
    expect(id).toBe("ab");
  });
});

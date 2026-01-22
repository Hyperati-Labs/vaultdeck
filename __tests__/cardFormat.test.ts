import {
  displayCardNumber,
  formatFullCardNumber,
  deriveLast4,
} from "../src/utils/cardFormat";

const baseCard = {
  id: "1",
  nickname: "Test",
  issuer: "Bank",
  cardholderName: "A",
  expiryMonth: "01",
  expiryYear: "30",
  tags: [],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

describe("cardFormat", () => {
  it("formats full card numbers into 4-digit groups", () => {
    expect(formatFullCardNumber("4111 1111-1111 1111")).toBe(
      "4111 1111 1111 1111"
    );
    expect(formatFullCardNumber("123")).toBe("123");
  });

  it("masks card numbers for display", () => {
    const withNumber = {
      ...baseCard,
      cardNumber: "4111111111111234",
    } as const;
    expect(displayCardNumber(withNumber)).toBe("**** **** **** 1234");

    const withLast4 = { ...baseCard, last4: "9876" } as const;
    expect(displayCardNumber(withLast4)).toBe("**** **** **** 9876");

    const empty = { ...baseCard } as const;
    expect(displayCardNumber(empty)).toBe("Not stored");
  });

  it("returns short numbers without masking", () => {
    const short = { ...baseCard, cardNumber: "123" } as const;
    expect(displayCardNumber(short)).toBe("123");
  });

  it("derives last4 safely", () => {
    expect(deriveLast4("1234 5678")).toBe("5678");
    expect(deriveLast4("123")).toBeUndefined();
    expect(deriveLast4()).toBeUndefined();
  });
});

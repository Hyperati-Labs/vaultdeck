export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/\D/g, "");
  if (!digits) {
    return "unknown";
  }
  if (digits.startsWith("4")) {
    return "visa";
  }
  const prefix2 = Number(digits.slice(0, 2));
  const prefix4 = Number(digits.slice(0, 4));
  if (
    (prefix2 >= 51 && prefix2 <= 55) ||
    (prefix4 >= 2221 && prefix4 <= 2720)
  ) {
    return "mastercard";
  }
  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "amex";
  }
  if (
    digits.startsWith("6011") ||
    digits.startsWith("65") ||
    (Number(digits.slice(0, 3)) >= 644 && Number(digits.slice(0, 3)) <= 649)
  ) {
    return "discover";
  }
  return "unknown";
}

import type { Card } from "../types/vault";

function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\s+/g, "");
  if (digits.length <= 4) {
    return digits;
  }
  const last4 = digits.slice(-4);
  return `**** **** **** ${last4}`;
}

export function formatFullCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(" ");
}

export function displayCardNumber(card: Card): string {
  if (card.cardNumber) {
    return maskCardNumber(card.cardNumber);
  }
  if (card.last4) {
    return `**** **** **** ${card.last4}`;
  }
  return "Not stored";
}

export function deriveLast4(cardNumber?: string): string | undefined {
  if (!cardNumber) {
    return undefined;
  }
  const digits = cardNumber.replace(/\s+/g, "");
  if (digits.length < 4) {
    return undefined;
  }
  return digits.slice(-4);
}

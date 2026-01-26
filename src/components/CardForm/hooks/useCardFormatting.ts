// Local formatter helpers (no global registry) kept in this hook scope
const formatCardNumber = (value: string): string =>
  value.replace(/\D/g, "").slice(0, 19);

const formatExpiryDate = (text: string): string => {
  let clean = text.replace(/\//g, "").replace(/\D/g, "");

  if (clean.length > 0) {
    const firstDigit = parseInt(clean[0]);
    if (firstDigit > 1) {
      clean = "0" + clean;
    } else if (clean.length >= 2) {
      const month = parseInt(clean.substring(0, 2));
      if (month > 12) {
        clean = "0" + clean[0];
      } else if (month === 0) {
        clean = "0";
      }
    }
  }

  clean = clean.substring(0, 6);
  let formatted = clean;
  if (clean.length > 2) {
    formatted = clean.substring(0, 2) + "/" + clean.substring(2);
  }

  return formatted;
};

const formatDisplayCardNumber = (digits: string): string => {
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(" ");
};

/**
 * useCardFormatting Hook
 * Provides formatting functions for card form inputs using local helpers
 */
export function useCardFormatting() {
  return {
    handleExpiryChange: formatExpiryDate,
    handleCardNumberChange: formatCardNumber,
    formatCardNumberForDisplay: formatDisplayCardNumber,
  };
}

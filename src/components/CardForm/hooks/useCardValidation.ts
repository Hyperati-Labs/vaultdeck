import { useMemo } from "react";
import type { Card } from "../../../types/vault";
import type { CardFormState } from "./useCardFormState";

// Local validation helpers (no global registry)
const validateNickname = (nickname: string) => nickname.trim().length >= 1;

const validateExpiryFormat = (expiryDate: string) => expiryDate.length === 7;

const validateExpiryNotExpired = (expiryDate: string) => {
  if (!expiryDate || expiryDate.length !== 7) return false;
  const [month, year] = expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100; // last 2 digits
  const currentMonth = currentDate.getMonth() + 1;
  const expiryYear = parseInt(year);
  const expiryMonth = parseInt(month);
  if (Number.isNaN(expiryMonth) || Number.isNaN(expiryYear)) return false;
  if (expiryYear > currentYear) return true;
  if (expiryYear === currentYear && expiryMonth >= currentMonth) return true;
  return false;
};

export function useCardValidation(
  state: CardFormState,
  initial?: Partial<Card>
) {
  const canSubmit = useMemo(() => {
    return (
      validateNickname(state.nickname) &&
      validateExpiryFormat(state.expiryDate) &&
      validateExpiryNotExpired(state.expiryDate)
    );
  }, [state.nickname, state.expiryDate]);

  const isDirty = useMemo(() => {
    return (
      state.nickname !== (initial?.nickname ?? "") ||
      state.issuer !== (initial?.issuer ?? "") ||
      state.cardholderName !== (initial?.cardholderName ?? "") ||
      state.cardNumber !== (initial?.cardNumber ?? "") ||
      state.expiryDate !==
        (initial?.expiryMonth && initial?.expiryYear
          ? `${initial.expiryMonth}/${initial.expiryYear}`
          : "") ||
      state.notes !== (initial?.notes ?? "") ||
      JSON.stringify(state.selectedTags) !== JSON.stringify(initial?.tags ?? [])
    );
  }, [state, initial]);

  return {
    canSubmit,
    isDirty,
  };
}

import { useMemo } from "react";
import type { Card } from "../../../types/vault";
import type { CardFormState } from "./useCardFormState";

export type CardValidationErrors = {
  nickname?: string;
  issuer?: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
};

const validateNickname = (nickname: string) => nickname.trim().length >= 1;
const validateIssuer = (issuer: string) => issuer.trim().length >= 1;
const validateCardholder = (name: string) => name.trim().length >= 1;

const normalizeCardNumber = (cardNumber: string) =>
  cardNumber.replace(/\D/g, "");
const validateCardNumber = (cardNumber: string) => {
  const digits = normalizeCardNumber(cardNumber);
  return digits.length >= 12 && digits.length <= 19;
};

const validateExpiryFormat = (expiryDate: string) =>
  /^\d{2}\/\d{4}$/.test(expiryDate);

const validateExpiryMonth = (expiryDate: string) => {
  if (!validateExpiryFormat(expiryDate)) return false;
  const [month] = expiryDate.split("/");
  const expiryMonth = parseInt(month, 10);
  return expiryMonth >= 1 && expiryMonth <= 12;
};

const validateExpiryNotExpired = (expiryDate: string) => {
  if (!validateExpiryFormat(expiryDate) || !validateExpiryMonth(expiryDate)) {
    return false;
  }
  const [month, year] = expiryDate.split("/");
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const expiryYear = parseInt(year, 10);
  const expiryMonth = parseInt(month, 10);
  if (expiryYear > currentYear) return true;
  if (expiryYear === currentYear && expiryMonth >= currentMonth) return true;
  return false;
};

export function useCardValidation(
  state: CardFormState,
  initial?: Partial<Card>,
  selectedTagsOverride?: string[]
) {
  const errors = useMemo<CardValidationErrors>(() => {
    const nicknameValid = validateNickname(state.nickname);
    const issuerValid = validateIssuer(state.issuer);
    const cardholderValid = validateCardholder(state.cardholderName);
    const cardNumberDigits = normalizeCardNumber(state.cardNumber);
    const cardNumberValid = validateCardNumber(state.cardNumber);
    const expiryFormatValid = validateExpiryFormat(state.expiryDate);
    const expiryMonthValid = validateExpiryMonth(state.expiryDate);
    const expiryDateValid =
      expiryFormatValid &&
      expiryMonthValid &&
      validateExpiryNotExpired(state.expiryDate);

    const nextErrors: CardValidationErrors = {};
    if (!nicknameValid) nextErrors.nickname = "Add a nickname";
    if (!issuerValid) nextErrors.issuer = "Enter the bank name";
    if (!cardholderValid)
      nextErrors.cardholderName = "Enter the name on the card";
    if (cardNumberDigits.length === 0) {
      nextErrors.cardNumber = "Card number is required";
    } else if (cardNumberDigits.length < 12) {
      nextErrors.cardNumber = "Card number looks too short";
    } else if (cardNumberDigits.length > 19) {
      nextErrors.cardNumber = "Card number looks too long";
    } else if (!cardNumberValid) {
      nextErrors.cardNumber = "Card number is invalid";
    }

    if (!expiryFormatValid) {
      nextErrors.expiryDate = "Use MM/YYYY";
    } else if (!expiryMonthValid) {
      nextErrors.expiryDate = "Month must be between 01 and 12";
    } else if (!expiryDateValid) {
      nextErrors.expiryDate = "Expiry can’t be in the past";
    }

    return nextErrors;
  }, [
    state.nickname,
    state.issuer,
    state.cardholderName,
    state.cardNumber,
    state.expiryDate,
  ]);

  const canSubmit = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const isDirty = useMemo(() => {
    const currentTags =
      selectedTagsOverride !== undefined
        ? selectedTagsOverride
        : state.selectedTags;
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
      JSON.stringify(currentTags) !== JSON.stringify(initial?.tags ?? [])
    );
  }, [state, initial, selectedTagsOverride]);

  return {
    canSubmit,
    isDirty,
    errors,
  };
}

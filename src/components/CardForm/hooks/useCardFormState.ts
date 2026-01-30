import { useState } from "react";
import type { Card } from "../../../types/vault";

export interface CardFormState {
  nickname: string;
  issuer: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  notes: string;
  selectedTags: string[];
  tagInput: string;
  tagInputVisible: boolean;
}

export function useCardFormState(initial?: Partial<Card>) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [issuer, setIssuer] = useState(initial?.issuer ?? "");
  const [cardholderName, setCardholderName] = useState(
    initial?.cardholderName ?? ""
  );
  const [cardNumber, setCardNumber] = useState(initial?.cardNumber ?? "");
  const [expiryDate, setExpiryDate] = useState(
    initial?.expiryMonth && initial?.expiryYear
      ? `${initial.expiryMonth}/${initial.expiryYear}`
      : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.tags ?? []
  );
  const [tagInput, setTagInput] = useState("");
  const [tagInputVisible, setTagInputVisible] = useState(false);

  return {
    nickname,
    setNickname,
    issuer,
    setIssuer,
    cardholderName,
    setCardholderName,
    cardNumber,
    setCardNumber,
    expiryDate,
    setExpiryDate,
    notes,
    setNotes,
    selectedTags,
    setSelectedTags,
    tagInput,
    setTagInput,
    tagInputVisible,
    setTagInputVisible,
  };
}

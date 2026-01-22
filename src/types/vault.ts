export type Card = {
  id: string;
  nickname: string;
  issuer: string;
  cardholderName: string;
  cardNumber?: string;
  last4?: string;
  expiryMonth: string;
  expiryYear: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type VaultData = {
  version: 1;
  cards: Card[];
  updatedAt: string;
};

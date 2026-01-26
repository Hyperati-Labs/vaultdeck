/**
 * CardForm component and related exports
 * A comprehensive form for creating and editing payment cards
 * 100% future-proof with pluggable validators, formatters, and field configurations
 */

// Main component - exported from parent directory
// We re-export it from here for convenience when importing from the CardForm folder
import CardForm from "../CardForm";

export { CardForm };

// Hooks
export { useCardFormatting } from "./hooks/useCardFormatting";
export { useCardFormState } from "./hooks/useCardFormState";
export { useCardValidation } from "./hooks/useCardValidation";
export { useCardTags } from "./hooks/useCardTags";
export { useDiscardWarning } from "./hooks/useDiscardWarning";

// Types
export type { CardFormState } from "./hooks/useCardFormState";

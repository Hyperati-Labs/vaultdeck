/**
 * useDiscardWarning Hook
 * Manages unsaved changes warning modal and navigation blocking
 * Extracted from CardForm component for reusability
 */

import { useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";

/**
 * Hook that manages discard warning for unsaved changes
 * Shows modal when user tries to leave with unsaved changes
 * @param isDirty - Whether form has unsaved changes
 * @returns Discard warning state and helpers
 */
export function useDiscardWarning(isDirty: boolean) {
  const navigation = useNavigation();
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const isDiscarding = useRef(false);

  /**
   * Block navigation if form is dirty
   * Shows modal and allows user to confirm discard
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!isDirty || isDiscarding.current) {
        return;
      }
      e.preventDefault();
      setPendingAction(e.data.action);
      setDiscardModalVisible(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  /**
   * Confirm discard and proceed with pending navigation
   */
  const confirmDiscard = () => {
    setDiscardModalVisible(false);
    if (pendingAction) {
      isDiscarding.current = true;
      navigation.dispatch(pendingAction);
    }
  };

  /**
   * Cancel discard and stay on form
   */
  const cancelDiscard = () => {
    setDiscardModalVisible(false);
  };

  return {
    discardModalVisible,
    setDiscardModalVisible,
    pendingAction,
    isDiscarding,
    confirmDiscard,
    cancelDiscard,
  };
}

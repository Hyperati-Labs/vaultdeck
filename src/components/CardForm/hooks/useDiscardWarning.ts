import { useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";

export function useDiscardWarning(isDirty: boolean) {
  const navigation = useNavigation();
  const [discardModalVisible, setDiscardModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const isDiscarding = useRef(false);

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

  const confirmDiscard = () => {
    setDiscardModalVisible(false);
    if (pendingAction) {
      isDiscarding.current = true;
      navigation.dispatch(pendingAction);
    }
  };

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

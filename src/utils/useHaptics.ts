import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useSettingsStore } from "../state/settingsStore";

export function useHaptics() {
  const enabled = useSettingsStore((state) => state.hapticsEnabled);

  const impact = useCallback((style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === "ios") {
      return;
    }
    if (!useSettingsStore.getState().hapticsEnabled) {
      return;
    }
    Haptics.impactAsync(style);
  }, []);

  const notify = useCallback((type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS === "ios") {
      return;
    }
    if (!useSettingsStore.getState().hapticsEnabled) {
      return;
    }
    Haptics.notificationAsync(type);
  }, []);

  return { impact, notify, enabled: Platform.OS === "ios" ? false : enabled };
}

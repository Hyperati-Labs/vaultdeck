import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppState, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import { useAuthStore } from "../src/state/authStore";
import { useSettingsStore } from "../src/state/settingsStore";
import { useVaultStore } from "../src/state/vaultStore";
import { useThemeStore } from "../src/state/themeStore";
import { useTheme } from "../src/utils/useTheme";
import UnlockScreen from "./unlock";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const {
    locked,
    initialized,
    loadAuthState,
    lock,
    autoLockSeconds,
    autoLockBypass,
  } = useAuthStore();
  const [isBackgrounded, setIsBackgrounded] = useState(
    AppState.currentState !== "active"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useTheme();
  const loadThemePreference = useThemeStore((state) => state.loadPreference);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsBackgrounded(nextState !== "active");
      if (nextState === "active") {
        clearTimer();
        return;
      }
      if (autoLockBypass) {
        return;
      }
      if (autoLockSeconds <= 0) {
        lock();
        return;
      }
      clearTimer();
      timerRef.current = setTimeout(() => {
        lock();
      }, autoLockSeconds * 1000);
    });
    return () => {
      clearTimer();
      subscription.remove();
    };
  }, [autoLockSeconds, autoLockBypass, lock]);

  useEffect(() => {
    if (!initialized) {
      return;
    }
  }, [initialized, locked]);

  useEffect(() => {
    if (locked) {
      useVaultStore.getState().clearVaultData();
    }
  }, [locked]);

  if (!fontsLoaded || !initialized) {
    return null;
  }

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={[styles.app, { backgroundColor: theme.colors.surface }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.surface },
          }}
        />
        {locked && (
          <View style={styles.unlockOverlay}>
            <UnlockScreen />
          </View>
        )}
        {isBackgrounded && (
          <View
            style={[
              styles.privacyOverlay,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={64}
              color={theme.colors.accent}
            />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  privacyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
});

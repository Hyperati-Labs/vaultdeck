import { Stack, useRouter, useSegments } from "expo-router";
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
import { logger } from "../src/utils/logger";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const router = useRouter();
  const segments = useSegments();
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

  if (__DEV__) {
    logger.info("RootLayout render");
  }

  useEffect(() => {
    logger.info("Loading auth state");
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
    logger.info("Auth state ready", { locked, segment: segments[0] });
    const isUnlockRoute = segments[0] === "unlock";
    if (locked && !isUnlockRoute) {
      router.replace("/unlock");
    } else if (!locked && isUnlockRoute) {
      router.replace("/");
    }
  }, [locked, initialized, router, segments]);

  useEffect(() => {
    if (locked) {
      useVaultStore.getState().clearVaultData();
    }
  }, [locked]);

  if (!fontsLoaded || !initialized) {
    return null;
  }

  const isUnlockRoute = segments[0] === "unlock";
  const hideContent = locked && !isUnlockRoute;

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={[styles.app, { backgroundColor: theme.colors.surface }]}>
        {hideContent ? (
          <View style={{ flex: 1, backgroundColor: theme.colors.surface }} />
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.surface },
            }}
          />
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
  privacyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
  },
});

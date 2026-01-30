import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "../utils/useTheme";
import { responsiveSpacing } from "../utils/responsive";

type ScreenProps = {
  children: ReactNode;
  compact?: boolean;
};

export default function Screen({ children, compact = false }: ScreenProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientTop,
        theme.colors.gradientMid,
        theme.colors.gradientBottom,
      ]}
      style={styles.root}
    >
      <View
        style={[
          styles.orb,
          styles.orbTop,
          { backgroundColor: theme.colors.accentSoft },
        ]}
      />
      <View
        style={[
          styles.orb,
          styles.orbBottom,
          { backgroundColor: theme.colors.surfaceTint },
        ]}
      />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={[styles.content, compact && styles.contentCompact]}>
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
    },
    contentCompact: {
      paddingTop: 0,
    },
    orb: {
      position: "absolute",
      width: responsiveSpacing(240),
      height: responsiveSpacing(240),
      borderRadius: responsiveSpacing(999),
      opacity: theme.isDark ? 0.3 : 0.6,
      transform: [{ scaleX: 1.2 }],
    },
    orbTop: {
      top: -responsiveSpacing(120),
      right: -responsiveSpacing(80),
    },
    orbBottom: {
      bottom: -responsiveSpacing(140),
      left: -responsiveSpacing(60),
    },
  });

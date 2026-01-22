import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "../utils/useTheme";

type GlassPanelProps = {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  intensity?: number;
};

export default function GlassPanel({
  children,
  style,
  contentStyle,
  intensity = 35,
}: GlassPanelProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.wrapper, { borderColor: theme.colors.glassBorder }, style]}
    >
      <BlurView
        intensity={intensity}
        tint={theme.isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.overlay, { backgroundColor: theme.colors.glass }]} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: 16,
  },
});

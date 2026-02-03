import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useTheme } from "../utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../utils/responsive";

interface SelectionToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onFavorite: () => void;
  onDuplicate: () => void;
  onClear: () => void;
  visible: boolean;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  onDelete,
  onFavorite,
  onDuplicate,
  onClear,
  visible,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const translateY = React.useRef(new Animated.Value(200)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 200,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <BlurView
        intensity={95}
        tint={theme.isDark ? "dark" : "light"}
        style={styles.blur}
      >
        <View style={styles.content}>
          <View style={styles.info}>
            <TouchableOpacity onPress={onClear} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.colors.ink} />
            </TouchableOpacity>
            <Text style={styles.countText}>
              {selectedCount} {selectedCount === 1 ? "card" : "cards"} selected
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onDuplicate}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="copy-outline"
                size={20}
                color={theme.colors.ink}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              onPress={onFavorite}
              style={styles.actionButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="heart-outline"
                size={22}
                color={theme.colors.ink}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              onPress={onDelete}
              style={[styles.actionButton]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={theme.colors.danger}
              />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: responsiveSpacing(40),
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      zIndex: 1000,
    },
    blur: {
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      backgroundColor: theme.isDark
        ? "rgba(30, 30, 30, 0.85)"
        : "rgba(255, 255, 255, 0.85)",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: responsiveSpacing(12),
      paddingHorizontal: responsiveSpacing(16),
    },
    info: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(16),
      color: theme.colors.ink,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: 16,
      paddingHorizontal: 4,
    },
    actionButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: theme.colors.outline,
    },
  });

export default SelectionToolbar;

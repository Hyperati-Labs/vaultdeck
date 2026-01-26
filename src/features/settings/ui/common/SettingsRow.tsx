import { ReactNode } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../../utils/useTheme";

type SettingsRowProps = {
  label: string;
  subLabel?: string;
  icon?: ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  disabled?: boolean;
  rightContent?: ReactNode;
  pressable?: boolean;
  labelColor?: string;
  iconColor?: string;
} & Partial<TouchableOpacityProps>;

export function SettingsRow({
  label,
  subLabel,
  icon,
  iconName,
  onPress,
  disabled = false,
  rightContent,
  pressable = false,
  labelColor,
  iconColor,
  ...touchableProps
}: SettingsRowProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  const leadingIcon =
    icon ||
    (iconName ? (
      <Ionicons
        name={iconName}
        size={20}
        color={iconColor ?? theme.colors.ink}
      />
    ) : null);

  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{leadingIcon}</View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, labelColor && { color: labelColor }]}>
          {label}
        </Text>
        {subLabel ? <Text style={styles.rowSubLabel}>{subLabel}</Text> : null}
      </View>
      {rightContent}
    </View>
  );

  if (onPress || pressable) {
    return (
      <TouchableOpacity
        style={styles.pressable}
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={label}
        activeOpacity={0.7}
        {...touchableProps}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pressable: {
      backgroundColor: theme.colors.surface,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      minHeight: 56,
      backgroundColor: theme.colors.surface,
    },
    rowIcon: {
      marginRight: theme.spacing.md,
      width: 24,
      alignItems: "center",
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 16,
      fontFamily: theme.font.regular,
      color: theme.colors.ink,
    },
    rowSubLabel: {
      fontSize: 12,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      marginTop: 2,
    },
  });

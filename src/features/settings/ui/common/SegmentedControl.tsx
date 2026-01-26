import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

import { useTheme } from "../../../../utils/useTheme";

export type SegmentOption<T extends string | number> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string | number> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceTint,
      borderRadius: theme.radius.md,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: theme.radius.sm - 2,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentActive: {
      backgroundColor: theme.colors.ink,
    },
    segmentText: {
      fontSize: 13,
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
      zIndex: 1,
    },
    segmentTextActive: {
      fontFamily: theme.font.bold,
      color: theme.colors.surface,
    },
  });

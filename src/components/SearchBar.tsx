import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../utils/responsive";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onCancel: () => void;
  isFocused: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onCancel,
  isFocused,
}) => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const inputRef = useRef<TextInput>(null);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();

    if (isFocused) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isFocused, animation]);

  const searchBarWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      responsiveSpacing(38),
      SCREEN_WIDTH -
        theme.spacing.lg * 2 -
        (isFocused ? responsiveSpacing(80) : 0),
    ],
  });

  const cancelButtonOpacity = animation.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0, 1],
  });

  const cancelButtonTranslateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [responsiveSpacing(50), 0],
  });

  const iconTranslateValue = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -responsiveSpacing(4)],
  });

  return (
    <View style={[styles.container, isFocused && styles.containerExpanded]}>
      <Animated.View style={[styles.searchWrapper, { width: searchBarWidth }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onFocus}
          style={[
            styles.searchTouchable,
            isFocused && styles.searchTouchableExpanded,
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              { transform: [{ translateX: iconTranslateValue }] },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={isFocused ? theme.colors.accent : theme.colors.ink}
            />
          </Animated.View>
          {isFocused && (
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search..."
              placeholderTextColor={theme.colors.muted}
              value={value}
              onChangeText={onChangeText}
              onBlur={onBlur}
              autoCorrect={false}
              returnKeyType="search"
            />
          )}
          {isFocused && value.length > 0 && (
            <TouchableOpacity
              onPress={() => onChangeText("")}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={16}
                color={theme.colors.muted}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>

      {isFocused && (
        <Animated.View
          style={[
            styles.cancelWrapper,
            {
              opacity: cancelButtonOpacity,
              transform: [{ translateX: cancelButtonTranslateX }],
            },
          ]}
        >
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      zIndex: 100,
    },
    containerExpanded: {
      flex: 1,
    },
    searchWrapper: {
      height: responsiveSpacing(38),
      borderRadius: responsiveSpacing(19),
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      overflow: "hidden",
      flexDirection: "row",
      alignItems: "center",
    },
    searchTouchable: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center", // Center by default (for collapsed state)
      height: "100%",
    },
    searchTouchableExpanded: {
      justifyContent: "flex-start",
      paddingHorizontal: theme.spacing.sm,
    },
    iconWrapper: {
      width: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      fontFamily: theme.font.regular,
      fontSize: responsiveFontSize(14),
      color: theme.colors.ink,
      marginLeft: theme.spacing.xs,
      paddingVertical: 0,
      height: "100%",
    } as any,
    clearButton: {
      padding: theme.spacing.xs,
    },
    cancelWrapper: {
      marginLeft: theme.spacing.md,
    },
    cancelButton: {
      paddingVertical: theme.spacing.xs,
    },
    cancelText: {
      color: theme.colors.accent,
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(14),
    },
  });

export default SearchBar;

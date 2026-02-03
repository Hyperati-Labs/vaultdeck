import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlassPanel from "./GlassPanel";
import CardBrandIcon from "./CardBrandIcon";
import { detectCardType } from "../utils/cardType";
import { displayCardNumber } from "../utils/cardFormat";
import { useTheme } from "../utils/useTheme";
import { responsiveFontSize, responsiveSpacing } from "../utils/responsive";
import { Card } from "../types/vault";

interface CardItemProps {
  item: Card;
  onPress: (item: Card) => void;
  onLongPress: (item: Card, ref: View | null) => void;
  onFavoritePress: (item: Card) => void;
  selectionMode?: boolean;
  selected?: boolean;
}

export const CardItem = React.forwardRef<View, CardItemProps>(
  (
    { item, onPress, onLongPress, onFavoritePress, selectionMode, selected },
    ref
  ) => {
    const theme = useTheme();
    const styles = getStyles(theme);

    const cardType = item.cardNumber
      ? detectCardType(item.cardNumber)
      : "unknown";
    const cardTypeLabel =
      cardType === "visa"
        ? "Visa"
        : cardType === "mastercard"
          ? "Mastercard"
          : cardType === "amex"
            ? "AMEX"
            : cardType === "discover"
              ? "Discover"
              : "Card";

    return (
      <TouchableOpacity
        ref={ref}
        style={StyleSheet.flatten([
          styles.cardRow,
          selectionMode && selected && styles.cardRowSelected,
        ])}
        onPress={() => onPress(item)}
        onLongPress={() => onLongPress(item, (ref as any)?.current)}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <GlassPanel
          style={StyleSheet.flatten([
            styles.cardGlass,
            selectionMode && selected && styles.cardGlassSelected,
          ])}
        >
          <View style={styles.cardRowHeader}>
            <View style={styles.cardTitleContainer}>
              {selectionMode && (
                <View style={styles.selectionIndicator}>
                  <Ionicons
                    name={selected ? "checkbox" : "square-outline"}
                    size={20}
                    color={selected ? theme.colors.accent : theme.colors.muted}
                  />
                </View>
              )}
              <Text
                style={styles.cardTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.nickname || "Untitled card"}
              </Text>
              {item.isCopy && (
                <Ionicons
                  name="copy-outline"
                  size={14}
                  color={theme.colors.muted}
                  style={styles.copyIcon}
                />
              )}
            </View>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onFavoritePress(item);
              }}
              hitSlop={12}
              style={styles.cardTagRow}
              accessibilityLabel={item.favorite ? "Unfavorite" : "Favorite"}
            >
              <Ionicons
                name={item.favorite ? "heart" : "heart-outline"}
                size={14}
                color={item.favorite ? theme.colors.accent : theme.colors.muted}
              />
            </Pressable>
          </View>
          <Text style={styles.cardMeta}>
            {item.issuer || "Issuer"} · {displayCardNumber(item)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>
              {item.expiryMonth}/{item.expiryYear}
            </Text>
            <View style={styles.cardTypePill}>
              <CardBrandIcon type={cardType} size={18} />
              <Text style={styles.cardTypePillText}>{cardTypeLabel}</Text>
            </View>
          </View>
        </GlassPanel>
      </TouchableOpacity>
    );
  }
);

CardItem.displayName = "CardItem";

const getStyles = (theme: any) =>
  StyleSheet.create({
    cardRow: {
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    cardRowSelected: {
      transform: [{ scale: 0.98 }],
    },
    cardGlass: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
    },
    cardGlassSelected: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accentSoft,
    },
    cardTitleContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    selectionIndicator: {
      marginRight: responsiveSpacing(4),
    },
    cardTitle: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(18),
      color: theme.colors.ink,
      flex: 1,
      minWidth: 0,
    },
    cardRowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.sm,
    },
    copyIcon: {
      opacity: 0.6,
      marginTop: 2,
    },
    cardTagRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(6),
    },
    cardMeta: {
      color: theme.colors.muted,
      marginTop: theme.spacing.xs,
      fontFamily: theme.font.regular,
    },
    cardFooter: {
      marginTop: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardFooterText: {
      fontFamily: theme.font.regular,
      color: theme.colors.muted,
    },
    cardTypePill: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 999,
      paddingVertical: responsiveSpacing(2),
      paddingHorizontal: responsiveSpacing(8),
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(6),
      backgroundColor: theme.colors.surfaceTint,
    },
    cardTypePillText: {
      fontFamily: theme.font.bold,
      color: theme.colors.muted,
      fontSize: responsiveFontSize(10),
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
  });

export default CardItem;

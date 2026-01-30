import React, { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "../utils/useTheme";
import { useHaptics } from "../utils/useHaptics";
import CardBrandIcon from "./CardBrandIcon";
import { detectCardType } from "../utils/cardType";
import {
  responsiveFontSize,
  responsiveSpacing,
  getCardDimensions,
} from "../utils/responsive";
import type { Card } from "../types/vault";

type VirtualCardProps = {
  card: Card;
  revealed: boolean;
  displayNumber: string;
};

const { width: CARD_WIDTH, height: CARD_HEIGHT } = getCardDimensions();

const clampRotation = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

export default function VirtualCard({
  card,
  revealed,
  displayNumber,
}: VirtualCardProps) {
  const theme = useTheme();
  const styles = getStyles(theme);

  const cardType = useMemo(
    () => detectCardType(card.cardNumber || ""),
    [card.cardNumber]
  );

  const rotateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const { impact } = useHaptics();

  // Idle breathing animation
  React.useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [breathe]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        impact(Haptics.ImpactFeedbackStyle.Medium);
        rotateX.stopAnimation();
        rotateY.stopAnimation();
        scale.stopAnimation();
        Animated.spring(scale, {
          toValue: 1.04,
          useNativeDriver: true,
          friction: 7,
          tension: 80,
        }).start();
      },
      onPanResponderMove: (_evt, gestureState) => {
        const nextX = clampRotation(-gestureState.dy / 2, 20);
        const nextY = clampRotation(gestureState.dx / 2, 20);
        rotateX.setValue(nextX);
        rotateY.setValue(nextY);
      },
      onPanResponderRelease: () => {
        impact(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
          Animated.spring(rotateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 120,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 120,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 120,
          }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(rotateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 120,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 6,
            tension: 120,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 120,
          }),
        ]).start();
      },
    })
  ).current;

  const rotateXInterpolate = rotateX.interpolate({
    inputRange: [-30, 30],
    outputRange: ["-30deg", "30deg"],
  });

  const rotateYInterpolate = rotateY.interpolate({
    inputRange: [-30, 30],
    outputRange: ["-30deg", "30deg"],
  });

  const breatheInterpolate = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const baseTransform = [
    { perspective: 1200 },
    { rotateX: rotateXInterpolate },
    { rotateY: rotateYInterpolate },
    { scale },
    { translateY: breatheInterpolate },
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.cardShell, { transform: baseTransform }]}
      >
        <Animated.View style={[styles.cardFace, styles.cardFront]}>
          <LinearGradient
            colors={
              theme.isDark
                ? ["#1a1f2c", "#0f141b", "#090d12"]
                : ["#2d3446", "#1a1f2c", "#0a0f18"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.highlight} />
            <View style={styles.cardHeader}>
              <Text style={styles.bankName}>
                {card.issuer || "Digital Vault"}
              </Text>
              <CardBrandIcon type={cardType} size={32} />
            </View>
            <View style={styles.chipContainer}>
              <View style={styles.chip} />
              <Ionicons
                name="wifi"
                size={20}
                color="rgba(255,255,255,0.4)"
                style={styles.contactless}
              />
            </View>
            <View style={styles.numberContainer}>
              <Text style={styles.cardNumber}>{displayNumber}</Text>
            </View>
            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Text style={styles.label}>CARDHOLDER</Text>
                <Text style={styles.value}>
                  {card.cardholderName || "VALUED MEMBER"}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.label}>EXPIRES</Text>
                <Text style={styles.value}>
                  {card.expiryMonth}/{card.expiryYear}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: theme.spacing.xl,
    },
    cardShell: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    },
    cardFace: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: responsiveSpacing(18),
      backfaceVisibility: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: responsiveSpacing(12) },
      shadowOpacity: 0.4,
      shadowRadius: responsiveSpacing(16),
      elevation: 20,
    },
    cardFront: {
      transform: [{ rotateY: "0deg" }],
    },
    cardGradient: {
      flex: 1,
      borderRadius: responsiveSpacing(18),
      padding: responsiveSpacing(24),
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    highlight: {
      position: "absolute",
      top: -responsiveSpacing(100),
      left: -responsiveSpacing(100),
      width: responsiveSpacing(300),
      height: responsiveSpacing(300),
      borderRadius: responsiveSpacing(150),
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: responsiveSpacing(10),
    },
    bankName: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(16),
      color: "#fff",
      letterSpacing: 0.5,
    },
    chipContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: responsiveSpacing(12),
      marginBottom: responsiveSpacing(20),
    },
    chip: {
      width: responsiveSpacing(44),
      height: responsiveSpacing(32),
      borderRadius: responsiveSpacing(6),
      backgroundColor: "#d4af37",
      opacity: 0.8,
    },
    contactless: {
      transform: [{ rotate: "90deg" }],
    },
    numberContainer: {
      flex: 1,
      justifyContent: "center",
      overflow: "hidden",
    },
    cardNumber: {
      fontFamily: theme.font.bold,
      fontSize: responsiveFontSize(22),
      color: "#fff",
      letterSpacing: responsiveFontSize(2),
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    footerItem: {
      gap: responsiveSpacing(4),
    },
    label: {
      fontSize: responsiveFontSize(9),
      fontFamily: theme.font.regular,
      color: "rgba(255,255,255,0.5)",
      letterSpacing: responsiveFontSize(1),
    },
    value: {
      fontSize: responsiveFontSize(14),
      fontFamily: theme.font.bold,
      color: "#fff",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
  });

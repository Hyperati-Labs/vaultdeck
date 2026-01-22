import { Platform } from "react-native";
import Svg, { Circle, Path, Rect, Text } from "react-native-svg";

import type { CardType } from "../utils/cardType";

type CardBrandIconProps = {
  type: CardType;
  size?: number;
};

export default function CardBrandIcon({ type, size = 18 }: CardBrandIconProps) {
  if (type === "visa") {
    return (
      <Svg width={size} height={size} viewBox="0 0 36 24">
        <Rect width="36" height="24" rx="4" fill="#1A1F71" />
        <Text
          x="6"
          y="16.5"
          fontSize="9"
          fontWeight="700"
          fill="#fff"
          letterSpacing="1"
        >
          VISA
        </Text>
      </Svg>
    );
  }

  if (type === "mastercard") {
    return (
      <Svg width={size} height={size} viewBox="0 0 36 24">
        <Rect width="36" height="24" rx="4" fill="#1A1A1A" />
        <Circle cx="15" cy="12" r="6.5" fill="#EB001B" />
        <Circle cx="21" cy="12" r="6.5" fill="#F79E1B" />
      </Svg>
    );
  }

  if (type === "amex") {
    const isIOS = Platform.OS === "ios";
    return (
      <Svg width={size} height={size} viewBox="0 0 36 24">
        <Rect width="36" height="24" rx="4" fill="#2E77BB" />
        <Text
          x="18"
          y={isIOS ? 11.5 : 12}
          fontSize={isIOS ? 5.5 : 6}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          AMERICAN
        </Text>
        <Text
          x="18"
          y={isIOS ? 19.5 : 20}
          fontSize={isIOS ? 5.5 : 6}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          EXPRESS
        </Text>
      </Svg>
    );
  }

  if (type === "discover") {
    return (
      <Svg width={size} height={size} viewBox="0 0 36 24">
        <Rect width="36" height="24" rx="4" fill="#0A0A0A" />
        <Path d="M0 15c7-6 19-8 36-7v3c-12 0-23 2-36 7z" fill="#FF6000" />
        <Path
          d="M7 9h4.5c2 0 3.5 1.2 3.5 3s-1.5 3-3.5 3H7V9zm3.9 4c1 0 1.6-.5 1.6-1s-.6-1-1.6-1H9.3v2h1.6zM17 9h2.1v6H17V9zm3.6 0h2.2l1.7 2.7L26.3 9h2.2l-3 4.6V15h-2.1v-1.4L20.6 9z"
          fill="#fff"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 36 24">
      <Rect width="36" height="24" rx="4" fill="#2C3545" />
      <Path d="M7 10h22v2H7v-2zm0 4h10v2H7v-2z" fill="#B7C0CE" />
    </Svg>
  );
}

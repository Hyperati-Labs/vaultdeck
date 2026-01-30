import { Dimensions } from "react-native";

const getScreenWidth = () => {
  const { width } = Dimensions.get("window");
  return width;
};

export const BREAKPOINTS = {
  SMALL: 320,
  MEDIUM: 375,
  LARGE: 414,
  XLARGE: 600,
};

export const getDeviceCategory = () => {
  const screenWidth = getScreenWidth();
  if (screenWidth < BREAKPOINTS.MEDIUM) return "small";
  if (screenWidth < BREAKPOINTS.LARGE) return "medium";
  if (screenWidth < BREAKPOINTS.XLARGE) return "large";
  return "xlarge";
};

export const responsiveFontSize = (baseSize: number): number => {
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();

  const scaleFactor = Math.sqrt(screenWidth / referenceWidth);
  const scaled = baseSize * scaleFactor;

  const minSize = baseSize * 0.85;
  const maxSize = baseSize * 1.25;

  return Math.round(Math.max(minSize, Math.min(maxSize, scaled)));
};

export const responsiveSpacing = (baseValue: number): number => {
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();
  const scaleFactor = Math.sqrt(screenWidth / referenceWidth);
  const scaled = baseValue * scaleFactor;

  const minValue = baseValue * 0.8;
  const maxValue = baseValue * 1.3;

  return Math.round(Math.max(minValue, Math.min(maxValue, scaled)));
};

export const responsiveDimension = (baseValue: number): number => {
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();
  return Math.round((baseValue * screenWidth) / referenceWidth);
};

export const getDeviceSpacing = (category: string = getDeviceCategory()) => {
  const baseSpacing = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  };

  if (category === "small") {
    return {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    };
  }

  if (category === "xlarge") {
    return {
      xs: 8,
      sm: 12,
      md: 20,
      lg: 32,
      xl: 40,
    };
  }

  return baseSpacing;
};

export const isSmallDevice = (): boolean => {
  return getScreenWidth() < BREAKPOINTS.MEDIUM;
};

export const isLargeDevice = (): boolean => {
  return getScreenWidth() >= BREAKPOINTS.XLARGE;
};

export const getCardDimensions = () => {
  const horizontalPadding = 40;
  const screenWidth = getScreenWidth();
  const cardWidth = screenWidth - horizontalPadding;
  const cardHeight = cardWidth / 1.586;

  return {
    width: cardWidth,
    height: cardHeight,
  };
};

export const getModalWidth = (): number => {
  const maxModalWidth = 400;
  const screenWidth = getScreenWidth();
  const availableWidth = screenWidth - 32;
  return Math.min(availableWidth, maxModalWidth);
};

export const responsiveShadow = (baseBlur: number) => {
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: responsiveFontSize(baseBlur / 2) },
    shadowOpacity: 0.2,
    shadowRadius: responsiveFontSize(baseBlur),
  };
};

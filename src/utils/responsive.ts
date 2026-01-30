import { Dimensions } from "react-native";

/**
 * Responsive Design System
 * Scales UI elements based on screen dimensions to support all device sizes
 */

// Get screen width lazily to support mocking in tests
const getScreenWidth = () => {
  const { width } = Dimensions.get("window");
  return width;
};

// Device size breakpoints
export const BREAKPOINTS = {
  SMALL: 320, // Small phones (iPhone SE)
  MEDIUM: 375, // Standard phones (iPhone 11)
  LARGE: 414, // Larger phones (iPhone 12 Pro Max)
  XLARGE: 600, // Tablets
};

// Get current device size category
export const getDeviceCategory = () => {
  const screenWidth = getScreenWidth();
  if (screenWidth < BREAKPOINTS.MEDIUM) return "small";
  if (screenWidth < BREAKPOINTS.LARGE) return "medium";
  if (screenWidth < BREAKPOINTS.XLARGE) return "large";
  return "xlarge";
};

/**
 * Scale font size based on screen width
 * Prevents text overflow on smaller devices
 * Scales proportionally on larger devices
 */
export const responsiveFontSize = (baseSize: number): number => {
  // Reference screen width (375 = iPhone standard)
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();

  // Calculate scale factor with diminishing return to prevent extreme scaling
  const scaleFactor = Math.sqrt(screenWidth / referenceWidth);
  const scaled = baseSize * scaleFactor;

  // Apply min/max bounds to prevent extreme sizes
  const minSize = baseSize * 0.85; // Don't shrink below 85%
  const maxSize = baseSize * 1.25; // Don't grow beyond 125%

  return Math.round(Math.max(minSize, Math.min(maxSize, scaled)));
};

/**
 * Scale spacing/padding based on screen width
 * Maintains proportional spacing on all devices
 */
export const responsiveSpacing = (baseValue: number): number => {
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();
  const scaleFactor = Math.sqrt(screenWidth / referenceWidth);
  const scaled = baseValue * scaleFactor;

  // Apply bounds
  const minValue = baseValue * 0.8;
  const maxValue = baseValue * 1.3;

  return Math.round(Math.max(minValue, Math.min(maxValue, scaled)));
};

/**
 * Scale dimensions proportionally to screen width
 * Useful for fixed-size components
 */
export const responsiveDimension = (baseValue: number): number => {
  const referenceWidth = 375;
  const screenWidth = getScreenWidth();
  return Math.round((baseValue * screenWidth) / referenceWidth);
};

/**
 * Get device-specific padding/margin
 * Provides different spacing for different device categories
 */
export const getDeviceSpacing = (category: string = getDeviceCategory()) => {
  const baseSpacing = {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  };

  // Scale spacing for smaller devices
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

/**
 * Check if device is small (needs special handling)
 */
export const isSmallDevice = (): boolean => {
  return getScreenWidth() < BREAKPOINTS.MEDIUM;
};

/**
 * Check if device is tablet or larger
 */
export const isLargeDevice = (): boolean => {
  return getScreenWidth() >= BREAKPOINTS.XLARGE;
};

/**
 * Get responsive card dimensions
 * Card width adapts to available screen space (with reduced width for better proportions)
 */
export const getCardDimensions = () => {
  const horizontalPadding = 40; // Increased padding for smaller card
  const screenWidth = getScreenWidth();
  const cardWidth = screenWidth - horizontalPadding;
  const cardHeight = cardWidth / 1.586; // Standard credit card aspect ratio

  return {
    width: cardWidth,
    height: cardHeight,
  };
};

/**
 * Get responsive modal width
 * Prevents modals from being too wide on large screens
 */
export const getModalWidth = (): number => {
  const maxModalWidth = 400;
  const screenWidth = getScreenWidth();
  const availableWidth = screenWidth - 32; // 16px padding on each side
  return Math.min(availableWidth, maxModalWidth);
};

/**
 * Scale shadow values for consistency across devices
 */
export const responsiveShadow = (baseBlur: number) => {
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: responsiveFontSize(baseBlur / 2) },
    shadowOpacity: 0.2,
    shadowRadius: responsiveFontSize(baseBlur),
  };
};

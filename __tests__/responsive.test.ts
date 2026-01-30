import { Dimensions } from "react-native";
import {
  responsiveFontSize,
  responsiveSpacing,
  responsiveDimension,
  getDeviceSpacing,
  isSmallDevice,
  isLargeDevice,
  getCardDimensions,
  getModalWidth,
  responsiveShadow,
  getDeviceCategory,
  BREAKPOINTS,
} from "../src/utils/responsive";

jest.mock("react-native", () => ({
  Dimensions: {
    get: jest.fn(),
  },
}));

const mockDimensions = Dimensions as jest.Mocked<typeof Dimensions>;

describe("Responsive Utils", () => {
  describe("responsiveFontSize", () => {
    it("should return base size on reference width (375)", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const result = responsiveFontSize(16);
      expect(result).toBe(16);
    });

    it("should scale up on larger screens", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      const result = responsiveFontSize(16);
      expect(result).toBeGreaterThan(16);
      expect(result).toBeLessThanOrEqual(20);
    });

    it("should scale down on smaller screens", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const result = responsiveFontSize(16);
      expect(result).toBeLessThan(16);
      expect(result).toBeGreaterThanOrEqual(14);
    });

    it("should not exceed max bounds", () => {
      mockDimensions.get.mockReturnValue({ width: 800, height: 1200 } as any);
      const result = responsiveFontSize(16);
      expect(result).toBeLessThanOrEqual(20);
    });

    it("should not go below min bounds", () => {
      mockDimensions.get.mockReturnValue({ width: 200, height: 400 } as any);
      const result = responsiveFontSize(16);
      expect(result).toBeGreaterThanOrEqual(14);
    });
  });

  describe("responsiveSpacing", () => {
    it("should return base value on reference width", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const result = responsiveSpacing(16);
      expect(result).toBe(16);
    });

    it("should scale up on larger screens", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      const result = responsiveSpacing(16);
      expect(result).toBeGreaterThan(16);
    });

    it("should scale down on smaller screens", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const result = responsiveSpacing(16);
      expect(result).toBeLessThan(16);
    });

    it("should respect min/max bounds", () => {
      mockDimensions.get.mockReturnValue({ width: 1000, height: 1200 } as any);
      const result = responsiveSpacing(16);
      expect(result).toBeLessThanOrEqual(21);
      expect(result).toBeGreaterThanOrEqual(13);
    });
  });

  describe("responsiveDimension", () => {
    it("should scale dimension proportionally to screen width", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const result = responsiveDimension(100);
      expect(result).toBe(100);
    });

    it("should scale up on wider screens", () => {
      mockDimensions.get.mockReturnValue({ width: 750, height: 800 } as any);
      const result = responsiveDimension(100);
      expect(result).toBe(200);
    });

    it("should scale down on narrower screens", () => {
      mockDimensions.get.mockReturnValue({ width: 187, height: 800 } as any);
      const result = responsiveDimension(100);
      expect(result).toBe(50);
    });
  });

  describe("getDeviceCategory", () => {
    it("should return 'small' for devices < 375px", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const result = getDeviceCategory();
      expect(result).toBe("small");
    });

    it("should return 'medium' for devices 375-413px", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 667 } as any);
      const result = getDeviceCategory();
      expect(result).toBe("medium");
    });

    it("should return 'large' for devices 414-599px", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      const result = getDeviceCategory();
      expect(result).toBe("large");
    });

    it("should return 'xlarge' for devices >= 600px", () => {
      mockDimensions.get.mockReturnValue({ width: 800, height: 1200 } as any);
      const result = getDeviceCategory();
      expect(result).toBe("xlarge");
    });
  });

  describe("getDeviceSpacing", () => {
    it("should return small device spacing for small devices", () => {
      const spacing = getDeviceSpacing("small");
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(24);
    });

    it("should return default spacing for medium devices", () => {
      const spacing = getDeviceSpacing("medium");
      expect(spacing.xs).toBe(6);
      expect(spacing.sm).toBe(10);
      expect(spacing.md).toBe(16);
      expect(spacing.lg).toBe(24);
      expect(spacing.xl).toBe(32);
    });

    it("should return xlarge spacing for tablet devices", () => {
      const spacing = getDeviceSpacing("xlarge");
      expect(spacing.xs).toBe(8);
      expect(spacing.sm).toBe(12);
      expect(spacing.md).toBe(20);
      expect(spacing.lg).toBe(32);
      expect(spacing.xl).toBe(40);
    });

    it("should auto-detect device category if not provided", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const spacing = getDeviceSpacing();
      expect(spacing.xs).toBe(4);
    });
  });

  describe("isSmallDevice", () => {
    it("should return true for devices < 375px", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      expect(isSmallDevice()).toBe(true);
    });

    it("should return false for devices >= 375px", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      expect(isSmallDevice()).toBe(false);
    });
  });

  describe("isLargeDevice", () => {
    it("should return true for devices >= 600px", () => {
      mockDimensions.get.mockReturnValue({ width: 800, height: 1200 } as any);
      expect(isLargeDevice()).toBe(true);
    });

    it("should return false for devices < 600px", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      expect(isLargeDevice()).toBe(false);
    });
  });

  describe("getCardDimensions", () => {
    it("should return responsive card dimensions", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const result = getCardDimensions();
      expect(result.width).toBe(335);
      expect(result.height).toBeCloseTo(result.width / 1.586);
    });

    it("should maintain aspect ratio on different screens", () => {
      mockDimensions.get.mockReturnValue({ width: 414, height: 896 } as any);
      const result = getCardDimensions();
      const aspectRatio = result.width / result.height;
      expect(aspectRatio).toBeCloseTo(1.586, 1);
    });

    it("should account for padding on small screens", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const result = getCardDimensions();
      expect(result.width).toBe(280);
    });
  });

  describe("getModalWidth", () => {
    it("should return max width for smaller screens", () => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 667 } as any);
      const result = getModalWidth();
      expect(result).toBe(288);
    });

    it("should return max modal width for larger screens", () => {
      mockDimensions.get.mockReturnValue({ width: 800, height: 1200 } as any);
      const result = getModalWidth();
      expect(result).toBe(400);
    });

    it("should not exceed max modal width", () => {
      mockDimensions.get.mockReturnValue({ width: 1000, height: 1200 } as any);
      const result = getModalWidth();
      expect(result).toBe(400);
    });
  });

  describe("responsiveShadow", () => {
    it("should return shadow object with responsive values", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const result = responsiveShadow(16);
      expect(result.shadowColor).toBe("#000");
      expect(result.shadowOpacity).toBe(0.2);
      expect(result.shadowOffset).toHaveProperty("width", 0);
      expect(result.shadowOffset).toHaveProperty("height");
      expect(result.shadowRadius).toBeGreaterThan(0);
    });

    it("should scale shadow values responsively", () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 800 } as any);
      const smallShadow = responsiveShadow(8);
      const largeShadow = responsiveShadow(16);
      expect(largeShadow.shadowRadius).toBeGreaterThan(
        smallShadow.shadowRadius
      );
    });
  });

  describe("BREAKPOINTS", () => {
    it("should define standard breakpoints", () => {
      expect(BREAKPOINTS.SMALL).toBe(320);
      expect(BREAKPOINTS.MEDIUM).toBe(375);
      expect(BREAKPOINTS.LARGE).toBe(414);
      expect(BREAKPOINTS.XLARGE).toBe(600);
    });
  });
});

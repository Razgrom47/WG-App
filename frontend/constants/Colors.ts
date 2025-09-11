/**
 * @file Colors.ts
 *
 * This file contains the color constants used throughout the application,
 * defining the color palette for the light and dark themes.
 */
export const LightColors = {
  primary: "#6200EE",
  secondary: "#03DAC6",
  background: "#FFFFFF",
  surface: "#F2F2F2",
  text: "#212121",
  success: "#2ecc71",
  danger: "#e74c3c",
  gray: "#888",
};

export const DarkColors = {
  primary: "#BB86FC",
  secondary: "#03DAC6",
  background: "#000000",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  success: "#2ecc71",
  danger: "#e74c3c",
  gray: "#AAA",
};

/**
 * Returns '#000000' or '#FFFFFF' for strong contrast against a given hex background.
 * This is to ensure text is readable when placed on top of the background color.
 */
export function getContrastTextColor(backgroundColor: string): string {
  try {
    const hex = backgroundColor.replace("#", "");
    if (hex.length !== 3 && hex.length !== 6) {
      return "#000000";
    }

    // Convert hex to RGB value
    const r = parseInt(
      hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2),
      16,
    );
    const g = parseInt(
      hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4),
      16,
    );
    const b = parseInt(
      hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6),
      16,
    );

    // Calculate the luminance of the color
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Return black for bright colors and white for dark colors based on luminance
    return luminance > 186 ? "#000000" : "#FFFFFF";
  } catch {
    return "#000000";
  }
}

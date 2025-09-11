import { createContext, Dispatch, SetStateAction } from "react";
import { ColorSchemeName } from "react-native";

/**
 * Theme override context for managing dark/light mode overrides.
 */
export type TThemeOverride = {
  colorSchemeOverride: ColorSchemeName;
  setColorSchemeOverride: Dispatch<SetStateAction<ColorSchemeName>>;
};

/**
 * Initialize the ThemeOverrideContext with default values.
 */
export const ThemeOverrideContext = createContext<TThemeOverride>({
  colorSchemeOverride: undefined,
  setColorSchemeOverride: () => {},
});

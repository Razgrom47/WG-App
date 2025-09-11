/**
 * @file CustomTabBarStyles.ts
 *
 * This file contains the styles for the CustomTabBar component,
 * defining the layout and appearance of the tab bar used in the app.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 56,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
});

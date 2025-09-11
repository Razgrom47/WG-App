/**
 * @file NotFoundStyles.ts
 *
 * This file contains the styles for the NotFound component,
 * defining the layout and appearance of the 404 Not Found page.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: "Roboto-Bold",
    fontSize: 22,
    marginBottom: 8,
  },
  subtext: {
    fontFamily: "Roboto-Regular",
    marginBottom: 12,
  },
  link: {
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    color: "#6200EE",
  },
});

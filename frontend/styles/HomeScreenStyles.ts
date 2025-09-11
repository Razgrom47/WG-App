/**
 * @file HomeScreenStyles.ts
 *
 * This file contains the styles for the HomeScreen component,
 * defining the layout and appearance of the home screen.
 */
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    overflow: "visible",
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontFamily: "Roboto-Bold",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: "Roboto-Regular",
    fontSize: 16,
    opacity: 0.7,
  },
  addButton: {
    alignSelf: "center",
  },
});
